import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Alert,
  Modal,
  TouchableOpacity,
  Text,
  Linking,
  Platform,
  Dimensions,
  StyleSheet,
  Share
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import * as Location from 'expo-location';
import { Ionicons } from "@expo/vector-icons";

// Theme & Styles
import { THEME } from "../theme";
import { createStyles } from "../styles/globalStyles";
import { parseJSON } from "../utils/cardUtils";

// Services
import {
  sendCardToOCR,
  getAllCards,
  deleteCard,
  setCardAsOwner,
  logoutUser,
  deleteAccount,
  updateCard,
  toggleFavorite,
  exportVCard,
  updateUserSettings,
  createCard
} from "../services/api";

// Components
import ScanPage from "./cards/ScanPage";
import ScannedListPage from "./cards/ScannedListPage";
import MyProfilePage from "./cards/MyProfilePage";
import CardDetailsModal from "./cards/CardDetailsModal";
import EditCardModal from "./cards/EditCardModal";
import AddContactModal from "./cards/AddContactModal";
import QRCodeModal from "./cards/QRCodeModal";
import EventModal from "./cards/EventModal";
import FAB from "./common/FAB";
import TabBar from "./common/TabBar";

const { width } = Dimensions.get("window");

export default function CardPicker({ user, onLogout }) {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState("scan"); // 'scan', 'scanned_list', 'my_profile'

  // Modals
  const [modalVisible, setModalVisible] = useState(false); // Add Contact Modal
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [creationMode, setCreationMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);

  // Camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPerm, setCameraPerm] = useState(null);
  const cameraRef = useRef(null);

  // Data
  const [ocrResult, setOcrResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editData, setEditData] = useState({});
  const [darkMode, setDarkMode] = useState(false); // Default to light mode or check user prefs

  // Theme Derivation
  const theme = darkMode ? THEME.dark : THEME.light;
  const styles = createStyles(theme);

  // --- Effects ---
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPerm(status === "granted");
    })();
    loadHistory();
  }, []);

  // --- API Actions ---
  const loadHistory = async () => {
    try {
      setLoading(true);
      const backendCards = await getAllCards();
      setHistory(backendCards || []);
    } catch (e) {
      console.warn("Failed to load history", e);
    } finally {
      setLoading(false);
    }
  };

  const processAndSave = async (uri) => {
    try {
      setLoading(true);
      setOcrResult(null);

      // Feature 3: Capture Location
      let locationData = {};
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          locationData = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          };

          // Optional: Reverse Geostrategy to get city name
          const reversed = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          });
          if (reversed.length > 0) {
            const r = reversed[0];
            locationData.locationName = `${r.city || r.region}, ${r.country}`;
          }
        }
      } catch (e) {
        console.warn("Location fetch failed", e);
      }

      const res = await sendCardToOCR(uri, {
        ...locationData,
        eventName: currentEvent
      });

      if (res) {
        // Feature: Automatically redirect to list and open card
        setOcrResult(null);
        await loadHistory();

        // Switch tab immediately
        setActiveTab("scanned_list");

        // Open the modal after a short delay
        setTimeout(() => {
          setSelectedCard(res);
        }, 100);
      } else {
        Alert.alert("OCR Error", "Failed to process card");
      }
    } catch (err) {
      console.error("OCR request failed", err);
      Alert.alert("OCR Error", "Unable to reach backend. Check network.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetOwner = async (cardId) => {
    const success = await setCardAsOwner(cardId);
    if (success) {
      Alert.alert("Success", "This card is now set as your profile card.");
      loadHistory();
      setOcrResult(null);
      setActiveTab("my_profile");
    } else {
      Alert.alert("Error", "Failed to set profile card.");
    }
  };

  const removeHistoryItem = (id) => {
    if (Platform.OS === 'web') {
      if (confirm("Delete this card permanently?")) {
        deleteCard(id).then(success => {
          if (success) loadHistory();
        });
      }
    } else {
      Alert.alert("Delete", "Delete this card permanently?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteCard(id);
            if (success) loadHistory();
          },
        },
      ]);
    }
  };

  const handleToggleFavorite = async (cardId) => {
    const result = await toggleFavorite(cardId);
    if (result !== null) {
      loadHistory();
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, is_favorite: result });
      }
    }
  };

  // --- User Account Actions ---
  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      if (confirm("Sign out of your account?")) {
        logoutUser().then(() => onLogout());
      }
    } else {
      Alert.alert("Logout", "Sign out of your account?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: async () => { await logoutUser(); onLogout(); } }
      ]);
    }
  };

  const handleDeletePress = () => {
    const performDelete = async () => {
      try {
        setLoading(true);
        await deleteAccount();
        onLogout();
      } catch (err) {
        if (Platform.OS === 'web') {
          alert("Error: " + err.message);
        } else {
          Alert.alert("Error", err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("Permanently delete your account and all saved cards? This action cannot be undone.")) {
        performDelete();
      }
    } else {
      Alert.alert("Delete Account", "Permanently delete account?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete }
      ]);
    }
  };

  const handleToggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await updateUserSettings({ dark_mode: newMode });
  };

  // --- Image Handling ---
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission", "Gallery permission is required.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (res.canceled) return;
      const uri = res.assets ? res.assets[0].uri : res.uri;
      setModalVisible(false);
      await processAndSave(uri);
    } catch (err) { console.warn("pickFromGallery", err); }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      setCameraOpen(false);
      await processAndSave(photo.uri);
    } catch (err) { Alert.alert("Error", "Failed to take photo."); }
  };

  // --- Quick Actions ---
  const handleQuickCall = (phones) => {
    const phoneList = parseJSON(phones);
    if (phoneList.length > 0) Linking.openURL(`tel:${phoneList[0]}`);
    else Alert.alert("No Phone", "No phone number available");
  };

  const handleQuickEmail = (emails) => {
    const emailList = parseJSON(emails);
    if (emailList.length > 0) Linking.openURL(`mailto:${emailList[0]}`);
    else Alert.alert("No Email", "No email address available");
  };

  const handleQuickWeb = (websites) => {
    const webList = parseJSON(websites);
    if (webList.length > 0) {
      let url = webList[0];
      if (!url.startsWith("http")) url = "https://" + url;
      Linking.openURL(url);
    } else Alert.alert("No Website", "No website available");
  };

  const handleExportVCard = async (cardId) => {
    try {
      const data = await exportVCard(cardId);
      if (!data) {
        Alert.alert("Export Error", "No contact data received from server.");
        return;
      }

      if (Platform.OS === "web") {
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = "contact.vcf";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Mobile: Use native share sheet
        await Share.share({
          message: data, // The vCard text
          title: "Save Contact",
        });
      }
    } catch (error) {
      console.error("Export Trace:", error);
      Alert.alert("Export Failed", "An unexpected error occurred.");
    }
  };

  // --- Edit Mode ---
  const startEditMode = (card) => {
    setEditData({
      name: card.name || "",
      designation: card.designation || "",
      company: card.company || "",
      phones: parseJSON(card.phones).join(", "),
      emails: parseJSON(card.emails).join(", "),
      websites: parseJSON(card.websites).join(", "),
      addresses: parseJSON(card.addresses).join(", "),
    });
    setCreationMode(false);
    setEditMode(true);
  };

  const handleCreateECard = () => {
    setEditData({
      name: "",
      designation: "",
      company: "",
      phones: "",
      emails: "",
      websites: "",
      addresses: "",
    });
    setCreationMode(true);
    setEditMode(true);
  };

  const saveCardEdit = async () => {
    const cardPayload = {
      name: editData.name,
      designation: editData.designation,
      company: editData.company,
      phones: JSON.stringify(editData.phones.split(",").map(p => p.trim()).filter(p => p)),
      emails: JSON.stringify(editData.emails.split(",").map(e => e.trim()).filter(e => e)),
      websites: JSON.stringify(editData.websites.split(",").map(w => w.trim()).filter(w => w)),
      addresses: JSON.stringify(editData.addresses.trim() ? [editData.addresses.trim()] : []),
    };

    if (creationMode) {
      const newCard = await createCard(cardPayload);
      if (newCard) {
        // Auto-set as owner if creating from profile
        await setCardAsOwner(newCard.id);
        setEditMode(false);
        setCreationMode(false);
        loadHistory();
        Alert.alert("Success", "Your E-Card has been created and set as your profile!");
      }
    } else {
      if (!selectedCard) return;
      const updated = await updateCard(selectedCard.id, cardPayload);
      if (updated) {
        setSelectedCard(updated);
        setEditMode(false);
        loadHistory();
        Alert.alert("Success", "Card updated successfully");
      }
    }
  };

  // --- Derived State ---
  const filteredHistory = history.filter((c) => !c.is_owner && (
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  ));
  const ownerCard = history.find(c => c.is_owner);

  // --- Render ---
  const renderActiveTab = () => {
    switch (activeTab) {
      case "scan":
        return <ScanPage
          theme={theme} styles={styles}
          ocrResult={ocrResult} loading={loading}
          setModalVisible={setModalVisible} setOcrResult={setOcrResult}
          handleSetOwner={handleSetOwner} handleLogoutPress={handleLogoutPress}
          darkMode={darkMode}
          currentEvent={currentEvent} setCurrentEvent={setCurrentEvent}
          openEventModal={() => setEventModalVisible(true)}
        />;
      case "scanned_list":
        return <ScannedListPage
          theme={theme} styles={styles}
          loading={loading} darkMode={darkMode}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          loadHistory={loadHistory} filteredHistory={filteredHistory}
          setSelectedCard={setSelectedCard} removeHistoryItem={removeHistoryItem}
        />;
      case "my_profile":
        return <MyProfilePage
          theme={theme} styles={styles} user={user}
          ownerCard={ownerCard} handleLogoutPress={handleLogoutPress}
          setSelectedCard={setSelectedCard} removeHistoryItem={removeHistoryItem}
          setActiveTab={setActiveTab} setQrModalVisible={setQrModalVisible}
          handleToggleDarkMode={handleToggleDarkMode} handleDeletePress={handleDeletePress}
          handleCreateECard={handleCreateECard}
          darkMode={darkMode}
        />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, !!darkMode ? { backgroundColor: theme.bg } : null]}>
      <View style={styles.mainContainer}>
        {renderActiveTab()}

        <FAB
          activeTab={activeTab}
          onPress={() => setModalVisible(true)}
          theme={theme}
        />

        <TabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
        />
      </View>

      {/* Modals */}
      <CardDetailsModal
        theme={theme} styles={styles} user={user}
        selectedCard={selectedCard} setSelectedCard={setSelectedCard}
        editMode={editMode} visible={!!selectedCard}
        handleToggleFavorite={handleToggleFavorite}
        startEditMode={startEditMode}
        removeHistoryItem={removeHistoryItem}
        handleQuickCall={(nums) => {
          const arr = parseJSON(nums);
          if (arr.length > 0) Linking.openURL(`tel:${arr[0]}`);
        }}
        handleQuickEmail={(emails) => {
          const arr = parseJSON(emails);
          if (arr.length > 0) Linking.openURL(`mailto:${arr[0]}`);
        }}
        handleQuickWeb={(webs) => {
          const arr = parseJSON(webs);
          if (arr.length > 0) {
            let url = arr[0];
            if (!url.startsWith('http')) url = 'https://' + url;
            Linking.openURL(url);
          }
        }}
        handleExportVCard={handleExportVCard}
      />

      <EditCardModal
        theme={theme} styles={styles}
        editMode={editMode} setEditMode={setEditMode}
        creationMode={creationMode}
        editData={editData} setEditData={setEditData}
        saveCardEdit={saveCardEdit}
      />

      <AddContactModal
        theme={theme} styles={styles}
        modalVisible={modalVisible} setModalVisible={setModalVisible}
        pickFromGallery={pickFromGallery} setCameraOpen={setCameraOpen}
      />

      <QRCodeModal
        theme={theme} styles={styles}
        qrModalVisible={qrModalVisible} setQrModalVisible={setQrModalVisible}
        ownerCard={ownerCard}
      />

      <EventModal
        visible={eventModalVisible}
        onClose={() => setEventModalVisible(false)}
        onSave={(name) => setCurrentEvent(name)}
        theme={theme}
      />

      {/* Camera Component Overlay */}
      <Modal visible={cameraOpen} animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Camera style={{ flex: 1 }} ref={cameraRef} />
          <View style={camStyles.cameraFooter}>
            <TouchableOpacity onPress={() => setCameraOpen(false)}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={camStyles.captureRing} onPress={capturePhoto}>
              <View style={camStyles.captureCircle} />
            </TouchableOpacity>
            <View style={{ width: 32 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Minimal separate styles for Camera overlay which is always dark
const camStyles = StyleSheet.create({
  cameraFooter: {
    position: 'absolute', bottom: 60,
    flexDirection: 'row', width: '100%',
    justifyContent: 'space-around', alignItems: 'center'
  },
  captureRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff' },
});
