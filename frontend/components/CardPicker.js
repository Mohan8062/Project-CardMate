// components/CardPicker.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  TextInput,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { sendCardToOCR, getAllCards, deleteCard, clearAllCards, setCardAsOwner } from "../services/api";

const { width } = Dimensions.get("window");

export default function CardPicker() {
  const [activeTab, setActiveTab] = useState("scan"); // 'scan', 'scanned_list', 'my_profile'
  const [modalVisible, setModalVisible] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPerm, setCameraPerm] = useState(null);
  const cameraRef = useRef(null);

  const [ocrResult, setOcrResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPerm(status === "granted");
    })();
    loadHistory();
  }, []);

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
      const res = await sendCardToOCR(uri);
      if (res && !res.error) {
        setOcrResult(res);
        await loadHistory();
      } else {
        Alert.alert("OCR Error", res.error || "Failed to process card");
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

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission", "Gallery permission is required.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (res.canceled) return;
      const uri = res.assets ? res.assets[0].uri : res.uri;
      setModalVisible(false);
      await processAndSave(uri);
    } catch (err) {
      console.warn("pickFromGallery", err);
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      setCameraOpen(false);
      await processAndSave(photo.uri);
    } catch (err) {
      Alert.alert("Error", "Failed to take photo.");
    }
  };

  const removeHistoryItem = (id) => {
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
  };

  const filteredHistory = history.filter((c) => !c.is_owner && (
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const ownerCard = history.find(c => c.is_owner);

  const renderScanPage = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>CardMate</Text>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity><Ionicons name="settings-outline" size={24} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert("Logout", "Please reload the app to sign out.")}><Ionicons name="log-out-outline" size={24} color="#fff" /></TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIllustration}>
            <View style={styles.cardOutline}>
              <View style={styles.cardEyes}>
                <View style={styles.eye} />
                <View style={styles.eye} />
              </View>
              <View style={styles.cardLines} />
            </View>
            <View style={styles.sparkle}><Ionicons name="star" size={30} color="#FBBF24" /></View>
          </View>
          <Text style={styles.emptyText}>Quick Scan</Text>
          <Text style={styles.emptySubText}>Capture a card to analyze and save it</Text>

          <TouchableOpacity style={styles.scanBtnMain} onPress={() => setModalVisible(true)}>
            <Text style={styles.scanBtnText}>SCAN BUSINESS CARD</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 30 }} color="#1E3A8A" size="large" />}

        {ocrResult && (
          <View style={styles.activeResultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Last Scan Success!</Text>
              <TouchableOpacity onPress={() => setOcrResult(null)}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.resultBody}>
              <Text style={styles.activeName}>{ocrResult.name}</Text>
              <Text style={styles.activeDetail}>{ocrResult.designation || "No Designation"}</Text>
              <Text style={styles.activeDetail}>{ocrResult.company || "No Company"}</Text>

              <TouchableOpacity
                style={styles.setOwnerBtn}
                onPress={() => handleSetOwner(ocrResult.id)}
              >
                <Ionicons name="person-add" size={16} color="#fff" />
                <Text style={styles.setOwnerBtnText}>Set as My Profile Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderScannedListPage = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Scanned Cards</Text>
          <TouchableOpacity onPress={() => loadHistory()}><Ionicons name="refresh" size={24} color="#fff" /></TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Search collected cards"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.historyList}>
          <Text style={styles.listSectionTitle}>All Scanned Cards ({filteredHistory.length})</Text>
          {filteredHistory.length === 0 ? (
            <View style={[styles.emptyState, { marginTop: 60 }]}>
              <Ionicons name="library-outline" size={60} color="#CBD5E1" />
              <Text style={styles.noOwnerText}>No scanned cards yet</Text>
            </View>
          ) : (
            filteredHistory.map((item, index) => (
              <View key={item.id || index} style={styles.historyCard}>
                <View style={styles.historyThumb}>
                  <Ionicons name="person" size={24} color="#1E3A8A" />
                </View>
                <View style={styles.historyBody}>
                  <Text style={styles.historyName}>{item.name}</Text>
                  <Text style={styles.historyDetail}>{item.designation || "—"}</Text>
                  <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => removeHistoryItem(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );

  const renderMyProfilePage = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My card</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.ownerSection}>
          <Text style={styles.listSectionTitle}>Personal Business Card</Text>
          {ownerCard ? (
            <View style={styles.ownerCardBig}>
              <View style={[styles.historyThumb, { width: 60, height: 60 }]}>
                <Ionicons name="star" size={32} color="#FBBF24" />
              </View>
              <View style={styles.historyBody}>
                <Text style={[styles.historyName, { fontSize: 20 }]}>{ownerCard.name}</Text>
                <Text style={[styles.historyDetail, { fontSize: 16 }]}>{ownerCard.designation}</Text>
                <Text style={styles.historyDetail}>{ownerCard.company}</Text>
              </View>
              <TouchableOpacity onPress={() => removeHistoryItem(ownerCard.id)}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noOwnerBox}>
              <Ionicons name="card" size={40} color="#CBD5E1" />
              <Text style={styles.noOwnerText}>No Profile Card Set</Text>
              <Text style={styles.noOwnerSub}>Scan your card and select 'Set as My Profile Card' on the Scan tab</Text>

              <TouchableOpacity
                style={[styles.scanBtnMain, { marginTop: 20 }]}
                onPress={() => setActiveTab("scan")}
              >
                <Text style={styles.scanBtnText}>GO TO SCAN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "scan": return renderScanPage();
      case "scanned_list": return renderScannedListPage();
      case "my_profile": return renderMyProfilePage();
      default: return renderScanPage();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {renderActiveTab()}

        {/* Updated Bottom Tab Bar with 3 items */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab("scan")}
          >
            <View style={[styles.tabIconBg, activeTab === "scan" && styles.tabActiveBg]}>
              <Ionicons name="scan-outline" size={24} color={activeTab === "scan" ? "#1E3A8A" : "#64748B"} />
            </View>
            <Text style={[styles.tabLabel, activeTab === "scan" && styles.tabActiveLabel]}>Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab("scanned_list")}
          >
            <View style={[styles.tabIconBg, activeTab === "scanned_list" && styles.tabActiveBg]}>
              <Ionicons name="list-outline" size={24} color={activeTab === "scanned_list" ? "#1E3A8A" : "#64748B"} />
            </View>
            <Text style={[styles.tabLabel, activeTab === "scanned_list" && styles.tabActiveLabel]}>Scanned card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab("my_profile")}
          >
            <View style={[styles.tabIconBg, activeTab === "my_profile" && styles.tabActiveBg]}>
              <Ionicons name="person-outline" size={24} color={activeTab === "my_profile" ? "#1E3A8A" : "#64748B"} />
            </View>
            <Text style={[styles.tabLabel, activeTab === "my_profile" && styles.tabActiveLabel]}>My card</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeader}>Add contact...</Text>

            <TouchableOpacity style={styles.sheetButton} onPress={() => { setModalVisible(false); setCameraOpen(true); }}>
              <View style={styles.sheetIconBox}>
                <Ionicons name="camera" size={22} color="#475569" />
              </View>
              <Text style={styles.sheetButtonText}>Scan card or QR code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetButton} onPress={pickFromGallery}>
              <View style={styles.sheetIconBox}>
                <Ionicons name="images" size={22} color="#475569" />
              </View>
              <Text style={styles.sheetButtonText}>Upload from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetButton} onPress={() => Alert.alert("NFC", "NFC Scan initiated...")}>
              <View style={styles.sheetIconBox}>
                <MaterialCommunityIcons name="credit-card-wireless" size={22} color="#475569" />
              </View>
              <Text style={styles.sheetButtonText}>Scan NFC tag</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetButton} onPress={() => Alert.alert("Manual", "Enter details manually...")}>
              <View style={styles.sheetIconBox}>
                <FontAwesome5 name="pen" size={18} color="#475569" />
              </View>
              <Text style={styles.sheetButtonText}>Enter manually</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={cameraOpen} animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Camera style={{ flex: 1 }} ref={cameraRef} />
          <View style={styles.cameraFooter}>
            <TouchableOpacity onPress={() => setCameraOpen(false)}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureRing} onPress={capturePhoto}>
              <View style={styles.captureCircle} />
            </TouchableOpacity>
            <View style={{ width: 32 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1E3A8A" },
  mainContainer: { flex: 1, backgroundColor: "#F8FAFC" },

  headerContainer: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "700" },

  searchBar: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 48,
  },
  searchInput: { flex: 1, color: "#fff", marginHorizontal: 10, fontSize: 16 },

  scrollContent: { paddingVertical: 20 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingHorizontal: 40, marginTop: 20 },
  emptyIllustration: { marginBottom: 20, alignItems: 'center' },
  cardOutline: {
    width: 100, height: 65,
    borderWidth: 3, borderColor: "#94A3B8",
    borderRadius: 8, backgroundColor: "#E2E8F0",
    justifyContent: 'center', alignItems: 'center'
  },
  cardEyes: { flexDirection: 'row', gap: 8 },
  eye: { width: 8, height: 8, backgroundColor: '#1E3A8A', borderRadius: 4 },
  cardLines: { width: 40, height: 4, backgroundColor: '#94A3B8', marginTop: 8, borderRadius: 2 },
  sparkle: { position: 'absolute', top: -15, right: -15 },

  emptyText: { fontSize: 20, color: "#1E293B", textAlign: "center", fontWeight: "700", marginBottom: 8 },
  emptySubText: { fontSize: 14, color: "#94A3B8", textAlign: "center", marginBottom: 25 },

  scanBtnMain: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 4,
    shadowOpacity: 0.3,
  },
  scanBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  historyList: { paddingHorizontal: 20 },
  listSectionTitle: { fontSize: 12, fontWeight: "800", color: "#94A3B8", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  historyThumb: {
    width: 48, height: 48,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    marginRight: 15
  },
  historyBody: { flex: 1 },
  historyName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  historyDetail: { fontSize: 13, color: "#64748B", marginTop: 2 },
  historyDate: { fontSize: 11, color: "#94A3B8", marginTop: 4 },

  activeResultCard: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  resultTitle: { color: "#059669", fontWeight: "800", fontSize: 16 },
  activeName: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  activeDetail: { fontSize: 15, color: "#64748B", marginTop: 4 },

  setOwnerBtn: {
    backgroundColor: "#1E3A8A",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8
  },
  setOwnerBtnText: { color: '#fff', fontWeight: '700' },

  ownerSection: { paddingHorizontal: 20 },
  ownerCardBig: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2, borderColor: '#1E3A8A'
  },
  noOwnerBox: {
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1'
  },
  noOwnerText: { fontSize: 18, fontWeight: '700', color: '#64748B', marginTop: 10 },
  noOwnerSub: { fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' },

  tabBar: {
    height: 75,
    backgroundColor: "#fff",
    flexDirection: "row",
    borderTopWidth: 1, borderTopColor: "#F1F5F9",
    paddingBottom: 15
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabIconBg: { padding: 8, borderRadius: 12 },
  tabActiveBg: { backgroundColor: "#EFF6FF" },
  tabLabel: { fontSize: 10, color: "#94A3B8", marginTop: 4, fontWeight: '600' },
  tabActiveLabel: { color: "#1E3A8A" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25,
    paddingTop: 15
  },
  sheetHandle: { width: 50, height: 5, backgroundColor: "#E2E8F0", borderRadius: 3, alignSelf: 'center', marginBottom: 25 },
  sheetHeader: { fontSize: 18, color: "#1E293B", marginBottom: 15, fontWeight: '700' },
  sheetButton: { flexDirection: "row", alignItems: "center", paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  sheetIconBox: { width: 45, alignItems: 'center' },
  sheetButtonText: { fontSize: 16, color: "#1E293B", fontWeight: '600' },

  cameraFooter: {
    position: 'absolute', bottom: 50,
    flexDirection: 'row', width: '100%',
    justifyContent: 'space-around', alignItems: 'center'
  },
  captureRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 5, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
});
