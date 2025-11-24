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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendCardToOCR } from "../services/api"; // keep your existing api.js

export default function CardPicker() {
  // ui states
  const [modalVisible, setModalVisible] = useState(false); // bottom action sheet
  const [cameraOpen, setCameraOpen] = useState(false); // camera preview modal
  const [cameraPerm, setCameraPerm] = useState(null);
  const cameraRef = useRef(null);

  // scan states
  const [imageUri, setImageUri] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // history
  const [history, setHistory] = useState([]);

  // request camera permission once
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPerm(status === "granted");
    })();
    loadHistory();
  }, []);

  // Helpers: history storage
  const HISTORY_KEY = "cardHistory_v1";

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load history", e);
    }
  };

  const persistHistory = async (arr) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
      setHistory(arr);
    } catch (e) {
      console.warn("Failed to save history", e);
    }
  };

  const saveToHistory = async (entry) => {
    try {
      const newArr = [entry, ...history];
      await persistHistory(newArr);
    } catch (e) {
      console.warn("saveToHistory failed", e);
    }
  };

  const removeHistoryItem = (index) => {
    Alert.alert("Remove", "Remove this scan from history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const copy = [...history];
          copy.splice(index, 1);
          await persistHistory(copy);
        },
      },
    ]);
  };

  const clearHistory = () => {
    Alert.alert("Clear all history", "Are you sure you want to clear all saved scans?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(HISTORY_KEY);
          setHistory([]);
        },
      },
    ]);
  };

  // OCR pipeline helpers
  const processAndSave = async (uri) => {
    try {
      setLoading(true);
      setOcrResult(null);
      const res = await sendCardToOCR(uri);
      setOcrResult(res || {});
      await saveToHistory({ image: uri, result: res || {}, ts: Date.now() });
    } catch (err) {
      console.error("OCR request failed", err);
      Alert.alert("OCR Error", "Unable to reach OCR service. Check backend/network.");
    } finally {
      setLoading(false);
    }
  };

  // Pick from gallery
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
      setImageUri(uri);
      await processAndSave(uri);
      setModalVisible(false);
    } catch (err) {
      console.warn("pickFromGallery", err);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  // Camera capture
  const openCamera = async () => {
    if (cameraPerm === false) {
      Alert.alert("Permission", "Camera permission is denied. Enable it in settings.");
      return;
    }
    setCameraOpen(true);
    setModalVisible(false);
  };

  const capturePhoto = async () => {
    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, base64: false });
      if (!photo || !photo.uri) {
        Alert.alert("Camera", "Could not capture photo.");
        return;
      }
      setImageUri(photo.uri);
      setCameraOpen(false);
      await processAndSave(photo.uri);
    } catch (err) {
      console.warn("capturePhoto failed", err);
      Alert.alert("Error", "Failed to take photo.");
      setCameraOpen(false);
    }
  };

  // UI actions
  const handleScanButton = () => setModalVisible(true); // open action sheet
  const clearCurrent = () => {
    setImageUri(null);
    setOcrResult(null);
    setLoading(false);
  };

  // Render history entry
  const HistoryItem = ({ item, index }) => {
    const { image, result } = item;
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyPreview}>
          {image ? (
            <Image source={{ uri: image }} style={styles.historyImage} />
          ) : (
            <View style={styles.placeholderBox} />
          )}
        </View>

        <View style={styles.historyMeta}>
          <Text style={styles.historyName}>{result?.name || "No name detected"}</Text>
          <Text style={styles.historySub}>{result?.designation || result?.job_title || "—"}</Text>
          <Text style={styles.historyTime}>{new Date(item.ts).toLocaleString()}</Text>
        </View>

        <View style={styles.historyActions}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => { setImageUri(image); setOcrResult(result); }}>
            <Text style={styles.smallBtnText}>Open</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.smallBtn, styles.dangerBtn]} onPress={() => removeHistoryItem(index)}>
            <Text style={styles.smallBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>CardMate</Text>
          <Text style={styles.subtitle}>Scan • Save • Share</Text>
        </View>

        {/* SEARCH / ACTION */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.fabPrimary} onPress={handleScanButton}>
            <Text style={styles.fabText}>SCAN BUSINESS CARD</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fabSecondary} onPress={clearCurrent}>
            <Text style={styles.fabTextSecondary}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* CURRENT SCAN PREVIEW */}
        <View style={styles.previewCard}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewPlaceholderText}>No active scan</Text>
            </View>
          )}

          <View style={styles.previewBody}>
            <Text style={styles.fieldTitle}>{ocrResult?.name || "Name"}</Text>
            <Text style={styles.fieldSubtitle}>{ocrResult?.designation || ocrResult?.job_title || "Designation / Role"}</Text>
            <Text style={styles.company}>{ocrResult?.company || "Company"}</Text>

            {/* lists */}
            {ocrResult?.emails?.length > 0 && (
              <View style={styles.listBlock}>
                <Text style={styles.listTitle}>Emails</Text>
                {ocrResult.emails.map((e, i) => <Text style={styles.listItem} key={i}>{e}</Text>)}
              </View>
            )}

            {ocrResult?.phones?.length > 0 && (
              <View style={styles.listBlock}>
                <Text style={styles.listTitle}>Phones</Text>
                {ocrResult.phones.map((p, i) => <Text style={styles.listItem} key={i}>{p}</Text>)}
              </View>
            )}

            {ocrResult?.addresses?.length > 0 && (
              <View style={styles.listBlock}>
                <Text style={styles.listTitle}>Addresses</Text>
                {ocrResult.addresses.map((a, i) => <Text style={styles.listItem} key={i}>{a}</Text>)}
              </View>
            )}

            <Text style={styles.confidence}>
              {ocrResult ? `OCR Confidence: ${(ocrResult.ocr_avg_confidence * 100)?.toFixed(2)}%` : ""}
            </Text>
          </View>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 12 }} size="large" color="#0A884A" />}

        {/* HISTORY */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Scan History</Text>
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearHistoryText}>Clear all</Text>
          </TouchableOpacity>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>No saved scans yet. Tap “SCAN BUSINESS CARD” to begin.</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => <HistoryItem item={item} index={index} />}
            scrollEnabled={false} // parent ScrollView handles scrolling
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}

        {/* Bottom spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ACTION SHEET (modal) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setModalVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add contact</Text>

            <TouchableOpacity style={styles.sheetItem} onPress={pickFromGallery}>
              <Text style={styles.sheetItemText}>Upload image (Gallery)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={openCamera}>
              <Text style={styles.sheetItemText}>Scan now (Camera)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={() => { setModalVisible(false); Alert.alert("Not implemented", "QR / NFC not implemented yet"); }}>
              <Text style={styles.sheetItemText}>Scan QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={() => { setModalVisible(false); Alert.alert("Manual Entry", "Open manual entry screen (not implemented)"); }}>
              <Text style={styles.sheetItemText}>Manual entry</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CAMERA MODAL */}
      <Modal visible={cameraOpen} animationType="slide">
        <View style={styles.cameraContainer}>
          <Camera style={styles.cameraView} ref={cameraRef} ratio="16:9" />
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.captureBtn} onPress={capturePhoto}>
              <Text style={styles.captureText}>Capture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.captureBtn, styles.cancelCapture]} onPress={() => setCameraOpen(false)}>
              <Text style={styles.captureText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F7F9" },
  container: { padding: 18 },

  header: { marginTop: 4, marginBottom: 14 },
  title: { fontSize: 28, fontWeight: "800", color: "#0A3F2E" },
  subtitle: { color: "#6C756D", marginTop: 4 },

  controlsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 12 },
  fabPrimary: { flex: 1, marginRight: 8, backgroundColor: "#0A884A", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  fabText: { color: "#fff", fontWeight: "700" },
  fabSecondary: { width: 92, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#DDD", alignItems: "center", justifyContent: "center" },
  fabTextSecondary: { color: "#555", fontWeight: "600" },

  previewCard: { marginTop: 10, backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", flexDirection: "row", elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8 },
  previewImage: { width: 140, height: 140, resizeMode: "cover" },
  previewPlaceholder: { width: 140, height: 140, backgroundColor: "#EEF2EE", alignItems: "center", justifyContent: "center" },
  previewPlaceholderText: { color: "#99A199" },
  previewBody: { flex: 1, padding: 12 },
  fieldTitle: { fontSize: 18, fontWeight: "700" },
  fieldSubtitle: { color: "#666", marginTop: 4 },
  company: { color: "#777", marginTop: 6 },

  listBlock: { marginTop: 10 },
  listTitle: { fontSize: 13, fontWeight: "700", color: "#333" },
  listItem: { color: "#4E5550", marginTop: 3 },

  confidence: { color: "#8A8A8A", marginTop: 8, fontSize: 12 },

  historyHeader: { marginTop: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyTitle: { fontSize: 18, fontWeight: "800", color: "#0A3F2E" },
  clearHistoryText: { color: "#FF3B30", fontWeight: "700" },
  emptyBlock: { padding: 20, alignItems: "center" },
  emptyText: { color: "#7A827B" },

  historyItem: { backgroundColor: "#fff", marginVertical: 8, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.04 },
  historyPreview: { marginRight: 12 },
  historyImage: { width: 72, height: 60, borderRadius: 8 },
  placeholderBox: { width: 72, height: 60, borderRadius: 8, backgroundColor: "#EEE" },
  historyMeta: { flex: 1 },
  historyName: { fontWeight: "700", fontSize: 14 },
  historySub: { color: "#6F776F", marginTop: 4, fontSize: 12 },
  historyTime: { color: "#9AA09A", marginTop: 6, fontSize: 11 },
  historyActions: { marginLeft: 8, alignItems: "flex-end" },
  smallBtn: { backgroundColor: "#0A884A", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 8 },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  dangerBtn: { backgroundColor: "#FF3B30" },

  sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { backgroundColor: "#fff", paddingVertical: 18, paddingHorizontal: 18, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetTitle: { color: "#8A8A8A", marginBottom: 8 },
  sheetItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  sheetItemText: { fontSize: 16 },

  cameraContainer: { flex: 1, backgroundColor: "#000" },
  cameraView: { flex: 1 },
  cameraControls: { flexDirection: "row", justifyContent: "space-around", padding: 16, backgroundColor: "#fff" },
  captureBtn: { backgroundColor: "#0A884A", paddingVertical: 12, paddingHorizontal: 26, borderRadius: 10 },
  captureText: { color: "#fff", fontWeight: "700" },
  cancelCapture: { backgroundColor: "#FF3B30" },

});
