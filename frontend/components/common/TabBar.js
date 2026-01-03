import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function TAB_BAR({ activeTab, setActiveTab, theme }) {
    return (
        <View style={[styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab("scan")}
            >
                <View style={[styles.tabIconBg, activeTab === "scan" && { backgroundColor: theme.secondary }]}>
                    <Ionicons name="scan-outline" size={24} color={activeTab === "scan" ? theme.primary : theme.textSecondary} />
                </View>
                <Text style={[styles.tabLabel, activeTab === "scan" && { color: theme.primary }]}>Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab("scanned_list")}
            >
                <View style={[styles.tabIconBg, activeTab === "scanned_list" && { backgroundColor: theme.secondary }]}>
                    <Ionicons name="list-outline" size={24} color={activeTab === "scanned_list" ? theme.primary : theme.textSecondary} />
                </View>
                <Text style={[styles.tabLabel, activeTab === "scanned_list" && { color: theme.primary }]}>Cards</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab("my_profile")}
            >
                <View style={[styles.tabIconBg, activeTab === "my_profile" && { backgroundColor: theme.secondary }]}>
                    <Ionicons name="person-outline" size={24} color={activeTab === "my_profile" ? theme.primary : theme.textSecondary} />
                </View>
                <Text style={[styles.tabLabel, activeTab === "my_profile" && { color: theme.primary }]}>Profile</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: 85,
        flexDirection: "row",
        paddingBottom: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        elevation: 0, // Flat for Nothing OS, maybe remove shadow
        borderTopWidth: 1,
        borderStyle: 'solid',
    },
    tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
    tabIconBg: { padding: 8, borderRadius: 20, marginBottom: 4 }, // Rounded pill shape
    tabLabel: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
});
