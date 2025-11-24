// CardPicker.js
import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  Image,
  Text,
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendCardToOCR } from "../services/api";

export default function CardPicker() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem("cardHistory");
      if (data) setHistory(JSON.parse(data));
    } catch (err) { console.log("Load history error:", err); }
  };

  const saveHistory = async (newEntry) => {
    try {
      const updated = [newEntry, ...history];
      setHistory(updated);
      await AsyncStorage.setItem("cardHistory", JSON.stringify(updated));
    } catch (err) { console.log("Save history error:", err); }
  };

  const clearHistory = async () => {
    Alert.alert("Confirm", "Do you want to clear all history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => { await AsyncStorage.removeItem("cardHistory"); setHistory([]); },
      },
    ]);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { alert("Permission to access gallery is required!"); return; }

      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
      if (res.canceled) return;

      const uri = res.assets ? res.assets[0].uri : res.uri;
      setImage(uri); setLoading(true);

      const ocrResult = await sendCardToOCR(uri);
      setResult(ocrResult);
      saveHistory({ image: uri, result: ocrResult });
      setLoading(false);
    } catch (err) { console.log("Pick Image Error:", err); alert("Failed to pick image."); }
  };

  const cancelScan = () => { setImage(null); setResult(null); };

  const removeHistoryItem = (index) => {
    Alert.alert("Confirm", "Remove this history item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          const updated = [...history]; updated.splice(index, 1);
          setHistory(updated);
          await AsyncStorage.setItem("cardHistory", JSON.stringify(updated));
        },
      },
    ]);
  };

  const renderHistoryItem = ({ item, index }) => (
    <View style={styles.historyCard}>
      <Image source={{ uri: item.image }} style={styles.historyImage} />
      <Text style={styles.name}>{item.result.name || "Name not detected"}</Text>
      <Text style={styles.job}>{item.result.designation || "Job title not detected"}</Text>
      <Text style={styles.company}>{item.result.company || "Company not detected"}</Text>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeHistoryItem(index)}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>CardMate Scanner</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.pickBtn} onPress={pickImage}><Text style={styles.btnText}>Pick Image</Text></TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={cancelScan}><Text style={styles.btnText}>Cancel / Clear</Text></TouchableOpacity>
        <TouchableOpacity style={styles.historyBtn} onPress={clearHistory}><Text style={styles.btnText}>Clear History</Text></TouchableOpacity>
      </View>

      {/* OCR Result */}
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}
      {result && (
        <View style={styles.card}>
          <Text style={styles.name}>{result.name || "Name not detected"}</Text>
          <Text style={styles.job}>{result.designation || "Job title not detected"}</Text>
          <Text style={styles.company}>{result.company || "Company not detected"}</Text>

          {result.emails?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Emails:</Text>
              {result.emails.map((e,i)=><Text key={i} style={styles.text}>{e}</Text>)}
            </View>
          )}

          {result.phones?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phones:</Text>
              {result.phones.map((p,i)=><Text key={i} style={styles.text}>{p}</Text>)}
            </View>
          )}

          {result.websites?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Websites:</Text>
              {result.websites.map((w,i)=><Text key={i} style={styles.text}>{w}</Text>)}
            </View>
          )}

          {result.addresses?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Addresses:</Text>
              {result.addresses.map((a,i)=><Text key={i} style={styles.text}>{a}</Text>)}
            </View>
          )}

          <Text style={styles.confidence}>
            OCR Confidence: {(result.ocr_avg_confidence*100).toFixed(2)}%
          </Text>
        </View>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <>
          <Text style={styles.historyTitle}>Scan History</Text>
          <FlatList
            data={history}
            keyExtractor={(_,i)=>i.toString()}
            renderItem={renderHistoryItem}
            scrollEnabled={false} // Scroll handled by parent ScrollView
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        </>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 CardMate App</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 50, backgroundColor: "#f9f9f9" },
  header: { padding: 15, backgroundColor: "#007AFF", alignItems: "center" },
  headerText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  buttonRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 15 },
  pickBtn: { backgroundColor: "#34C759", padding: 10, borderRadius: 8 },
  cancelBtn: { backgroundColor: "#FF3B30", padding: 10, borderRadius: 8 },
  historyBtn: { backgroundColor: "#FF9500", padding: 10, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "bold" },
  image: { width: 250, height: 150, alignSelf: "center", borderRadius: 10, resizeMode: "contain", marginBottom: 15 },
  card: { margin: 15, backgroundColor: "#fff", padding: 15, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width:0,height:3 }, shadowRadius: 5, elevation: 3 },
  name: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  job: { fontSize: 16, color: "#555", marginBottom: 5 },
  company: { fontSize: 14, color: "#777", marginBottom: 10 },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#333" },
  text: { fontSize: 14, color: "#555", marginLeft: 5 },
  confidence: { marginTop: 10, fontSize: 12, color: "#999", fontStyle: "italic" },
  historyTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 15, marginTop: 20, marginBottom: 10, color: "#007AFF" },
  historyCard: { marginHorizontal: 15, marginBottom: 15, padding: 10, backgroundColor: "#fff", borderRadius: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: {width:0,height:2}, shadowRadius:3, elevation:2 },
  historyImage: { width: "100%", height: 100, borderRadius: 8, resizeMode: "contain", marginBottom: 5 },
  removeBtn: { marginTop: 5, backgroundColor: "#FF3B30", padding: 5, borderRadius: 6, alignItems: "center" },
  removeText: { color: "#fff", fontWeight: "bold" },
  footer: { padding: 10, backgroundColor: "#007AFF", alignItems: "center", marginTop: 20 },
  footerText: { color: "#fff", fontSize: 14 },
});
