import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function MyProfilePage({
    theme,
    styles,
    user,
    ownerCard,
    handleLogoutPress,
    setSelectedCard,
    removeHistoryItem,
    setActiveTab,
    setQrModalVisible,
    handleToggleDarkMode,
    handleDeletePress,
    handleCreateECard,
    darkMode
}) {
    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <TouchableOpacity onPress={handleLogoutPress} style={{ padding: 10, borderWidth: 1, borderColor: theme.border, borderRadius: 20 }}>
                        <Ionicons name="log-out-outline" size={20} color={theme.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* User Info Section */}
                <View style={[styles.userInfoCard, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
                    <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.avatarText, { color: theme.bg }]}>{user?.username?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ marginLeft: 15 }}>
                        <Text style={[styles.profileName, { color: theme.textPrimary }]}>{user?.username}</Text>
                        <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
                    </View>
                </View>

                <View style={styles.ownerSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={[styles.listSectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>Quick Network Widget</Text>
                        <Ionicons name="apps-outline" size={16} color={theme.textSecondary} />
                    </View>

                    {ownerCard ? (
                        <View>
                            <View
                                style={[
                                    styles.ownerCardBig,
                                    {
                                        backgroundColor: theme.bg,
                                        borderColor: theme.textPrimary,
                                        borderWidth: 2,
                                        borderRadius: 24,
                                        padding: 2,
                                        overflow: 'hidden'
                                    }]}
                            >
                                <TouchableOpacity
                                    style={{ padding: 25, backgroundColor: theme.card }}
                                    onPress={() => setQrModalVisible(true)}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1, marginRight: 10 }}>
                                            <Text style={[styles.historyName, { fontSize: 22, color: theme.textPrimary }]} numberOfLines={1}>
                                                {ownerCard.name}
                                            </Text>
                                            <Text style={[styles.historyDetail, { fontSize: 16, color: theme.textSecondary, marginTop: 4 }]} numberOfLines={1}>
                                                {ownerCard.designation}
                                            </Text>
                                            <Text style={[styles.historyDetail, { fontSize: 14, color: theme.textSecondary, marginTop: 2, fontWeight: '700' }]} numberOfLines={1}>
                                                {ownerCard.company}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 5 }}>
                                                <Ionicons name="qr-code-outline" size={14} color={theme.accent} />
                                                <Text style={{ fontSize: 10, fontFamily: 'monospace', color: theme.accent, fontWeight: 'bold' }}>TAP TO SHARE NOW</Text>
                                            </View>
                                        </View>
                                        <View style={{ backgroundColor: theme.bg, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                            <Ionicons name="qr-code" size={40} color={theme.textPrimary} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.editBtn, { marginTop: 15, borderColor: theme.border }]}
                                onPress={() => setSelectedCard(ownerCard)}
                            >
                                <Ionicons name="eye-outline" size={20} color={theme.textPrimary} />
                                <Text style={[styles.editBtnText, { color: theme.textPrimary }]}>View Full Profile Card</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.noOwnerBox, { borderColor: theme.border, paddingVertical: 30 }]}>
                            <View style={{ backgroundColor: theme.secondary + '22', padding: 20, borderRadius: 50, marginBottom: 15 }}>
                                <Ionicons name="id-card-outline" size={40} color={theme.primary} />
                            </View>
                            <Text style={[styles.noOwnerText, { color: theme.textPrimary, fontSize: 18, fontWeight: '700' }]}>No Digital Card Yet</Text>
                            <Text style={[styles.noOwnerSub, { color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 20, marginTop: 8 }]}>
                                Create your own professional e-card to share your details instantly via QR.
                            </Text>

                            <TouchableOpacity
                                style={[styles.scanBtnMain, {
                                    marginTop: 25,
                                    backgroundColor: theme.textPrimary,
                                    borderWidth: 0,
                                    width: '80%',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }]}
                                onPress={handleCreateECard}
                            >
                                <Ionicons name="add-circle" size={20} color={theme.bg} style={{ marginRight: 8 }} />
                                <Text style={[styles.scanBtnText, { color: theme.bg, fontWeight: '800' }]}>CREATE A E-CARD</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={{ marginTop: 40, paddingHorizontal: 20, gap: 12 }}>
                    {/* Dark Mode Toggle */}
                    <TouchableOpacity
                        style={[styles.editBtn, { justifyContent: 'space-between', backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={handleToggleDarkMode}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name={!!darkMode ? "moon" : "sunny"} size={20} color={theme.primary} />
                            <Text style={[styles.editBtnText, { color: theme.textPrimary }]}>Dark Mode</Text>
                        </View>
                        <View style={[styles.toggleSwitch, !!darkMode ? { backgroundColor: theme.bg, borderColor: theme.primary } : null]}>
                            <View style={[styles.toggleKnob, !!darkMode ? { marginLeft: 22, backgroundColor: theme.primary } : null]} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.deleteAccBtn, { backgroundColor: 'transparent', borderColor: theme.error }]}
                        onPress={handleDeletePress}
                    >
                        <Ionicons name="trash-outline" size={18} color={theme.error} />
                        <Text style={[styles.deleteAccText, { color: theme.error }]}>Delete Account Permanently</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}
