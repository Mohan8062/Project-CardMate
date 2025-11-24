// frontend/App.js
import React from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import CardPicker from "./components/CardPicker";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CardPicker />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
