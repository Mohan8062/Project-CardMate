import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Easing, Platform, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ScanPage({
    theme,
    styles,
    ocrResult,
    loading,
    setModalVisible,
    setOcrResult,
    handleSetOwner,
    handleLogoutPress,
    darkMode,
    currentEvent,
    setCurrentEvent,
    openEventModal
}) {
    // Feature 5: Dot Matrix Loading Animation
    const dotOpacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dotOpacity, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.linear }),
                    Animated.timing(dotOpacity, { toValue: 0.3, duration: 400, useNativeDriver: true, easing: Easing.linear })
                ])
            ).start();
        } else {
            dotOpacity.setValue(0);
        }
    }, [loading]);

    const DotLoader = () => (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3].map(i => (
                    <Animated.View key={i} style={{
                        width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary,
                        opacity: dotOpacity,
                        transform: [{ scale: dotOpacity.interpolate({ inputRange: [0.3, 1], outputRange: [0.8, 1.2] }) }]
                    }} />
                ))}
            </View>
            <Text style={{ marginTop: 15, fontFamily: 'monospace', fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 2 }}>Scanning...</Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            {!!currentEvent ? (
                <View style={styles.eventModeHeader}>
                    <Ionicons name="flash" size={12} color={theme.bg} />
                    <Text style={styles.eventModeText}>CONFERENCE MODE: {currentEvent.toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => setCurrentEvent(null)}>
                        <Ionicons name="close-circle" size={16} color={theme.bg} />
                    </TouchableOpacity>
                </View>
            ) : null}
            <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>CardMate</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {!ocrResult ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIllustration}>
                            <View style={styles.cardOutline}>
                                <View style={styles.cardEyes}>
                                    <View style={[styles.eye, { backgroundColor: theme.textPrimary }]} />
                                    <View style={[styles.eye, { backgroundColor: theme.textPrimary }]} />
                                </View>
                                <View style={[styles.cardLines, { backgroundColor: theme.textSecondary }]} />
                            </View>
                            <View style={styles.sparkle}><Ionicons name="star" size={30} color={theme.accent} /></View>
                        </View>
                        <Text style={[styles.emptyText, { color: theme.textPrimary }]}>Quick Scan</Text>
                        <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>Capture a card to analyze and save it</Text>

                        <TouchableOpacity
                            style={[styles.scanBtnMain, { backgroundColor: theme.primary, borderColor: theme.textPrimary }]}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.scanBtnText}>SCAN BUSINESS CARD</Text>
                        </TouchableOpacity>

                        {!currentEvent ? (
                            <TouchableOpacity
                                style={[styles.editBtn, { marginTop: 15, borderStyle: 'dashed' }]}
                                onPress={openEventModal}
                            >
                                <Ionicons name="calendar-outline" size={20} color={theme.textPrimary} />
                                <Text style={[styles.editBtnText, { color: theme.textPrimary }]}>START CONFERENCE MODE</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ) : null}

                {!!loading ? <DotLoader /> : null}

                {!!ocrResult ? (
                    <View style={[styles.activeResultCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={styles.resultHeader}>
                            <Text style={[styles.resultTitle, { color: theme.textPrimary }]}>Last Scan Success!</Text>
                            <TouchableOpacity onPress={() => setOcrResult(null)}>
                                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.resultBody}>
                            <Text style={[styles.activeName, { color: theme.textPrimary }]}>{ocrResult.name}</Text>
                            <Text style={[styles.activeDetail, { color: theme.textSecondary }]}>{ocrResult.designation || "No Designation"}</Text>
                            <Text style={[styles.activeDetail, { color: theme.textSecondary }]}>{ocrResult.company || "No Company"}</Text>

                            <TouchableOpacity
                                style={[styles.setOwnerBtn, { backgroundColor: theme.primary }]}
                                onPress={() => handleSetOwner(ocrResult.id)}
                            >
                                <Ionicons name="person-add" size={16} color={theme.bg} />
                                <Text style={[styles.setOwnerBtnText, { color: theme.bg }]}>Set as My Profile Card</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
}
