import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Linking,
    Platform,
    Alert,
    Dimensions,
    StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { DetailRow } from '../common/DetailRow';

export default function CardDetailsModal({
    theme,
    styles,
    user,
    selectedCard,
    setSelectedCard,
    editMode,
    visible,
    handleToggleFavorite,
    startEditMode,
    removeHistoryItem,
    handleQuickCall,
    handleQuickEmail,
    handleQuickWeb,
    handleExportVCard
}) {
    const parseJSON = (str) => {
        try {
            return JSON.parse(str || "[]");
        } catch (e) {
            return [];
        }
    };

    if (!selectedCard) return null;

    return (
        <Modal visible={visible && !editMode} animationType="slide">
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
                <View style={[styles.headerContainer, { paddingBottom: 15, borderBottomWidth: 0 }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => setSelectedCard(null)}>
                            <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { fontSize: 20 }]}>Card Details</Text>
                        <TouchableOpacity onPress={() => !!selectedCard && handleToggleFavorite(selectedCard.id)}>
                            <Ionicons
                                name={!!selectedCard?.is_favorite ? "star" : "star-outline"}
                                size={26}
                                color={!!selectedCard?.is_favorite ? theme.accent : theme.textPrimary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View>
                        <View style={[styles.detailCardTop, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <View style={[styles.detailAvatar, { backgroundColor: theme.secondary, borderColor: theme.border, borderWidth: 1 }]}>
                                <Ionicons name="person" size={50} color={theme.textPrimary} />
                            </View>
                            <Text style={[styles.detailNameText, { color: theme.textPrimary }]}>{selectedCard.name}</Text>
                            {!!selectedCard.designation ? <Text style={[styles.detailSubText, { color: theme.textSecondary }]}>{selectedCard.designation}</Text> : null}
                            {!!selectedCard.company ? <Text style={[styles.detailSubText, { fontWeight: '700', color: theme.textSecondary }]}>{selectedCard.company}</Text> : null}

                            {/* OCR Confidence */}
                            {!!(selectedCard.ocr_avg_confidence > 0) ? (
                                <View style={[styles.confidenceBadge, { backgroundColor: theme.secondary }]}>
                                    <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                                    <Text style={[styles.confidenceText, { color: theme.success }]}>
                                        {Math.round(selectedCard.ocr_avg_confidence * 100)}% accuracy
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Quick Actions */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 25, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                            <View style={{ flexDirection: 'row', gap: 20, paddingHorizontal: 10 }}>
                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleQuickCall(selectedCard.phones)}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: theme.secondary, borderRadius: 30 }]}>
                                        <Ionicons name="call" size={22} color={theme.textPrimary} />
                                    </View>
                                    <Text style={[styles.quickActionLabel, { color: theme.textSecondary }]}>Call</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleQuickEmail(selectedCard.emails)}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: theme.secondary, borderRadius: 30 }]}>
                                        <Ionicons name="mail" size={22} color={theme.textPrimary} />
                                    </View>
                                    <Text style={[styles.quickActionLabel, { color: theme.textSecondary }]}>Email</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => {
                                    const emailList = parseJSON(selectedCard.emails);
                                    if (emailList.length > 0) {
                                        const subject = encodeURIComponent(`Great meeting you!`);
                                        const body = encodeURIComponent(`Hi ${selectedCard.name},\n\nIt was great meeting you. Let's keep in touch!\n\nBest,\n${user?.username || 'CardMate User'}`);
                                        Linking.openURL(`mailto:${emailList[0]}?subject=${subject}&body=${body}`);
                                    }
                                }}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: theme.primary, borderRadius: 30 }]}>
                                        <Ionicons name="send" size={22} color={theme.bg} />
                                    </View>
                                    <Text style={[styles.quickActionLabel, { color: theme.textSecondary }]}>Follow-up</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleQuickWeb(selectedCard.websites)}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: theme.secondary, borderRadius: 30 }]}>
                                        <Ionicons name="globe" size={22} color={theme.textPrimary} />
                                    </View>
                                    <Text style={[styles.quickActionLabel, { color: theme.textSecondary }]}>Website</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleExportVCard(selectedCard.id)}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: theme.secondary, borderRadius: 30 }]}>
                                        <Ionicons name="download" size={22} color={theme.textPrimary} />
                                    </View>
                                    <Text style={[styles.quickActionLabel, { color: theme.textSecondary }]}>Export</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <View style={[styles.detailInfoSection, { backgroundColor: theme.bg }]}>
                            {!!selectedCard.tags && parseJSON(selectedCard.tags).length > 0 ? (
                                <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Smart Tags</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 }}>
                                        {parseJSON(selectedCard.tags).map((tag, idx) => (
                                            <View key={idx} style={styles.tagBadge}>
                                                <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ) : null}

                            {!!selectedCard.event_name ? (
                                <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Met At</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                        <Ionicons name="calendar-clear" size={18} color={theme.primary} style={{ marginRight: 10 }} />
                                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedCard.event_name}</Text>
                                    </View>
                                </View>
                            ) : null}

                            {!!(selectedCard.location_name || selectedCard.location_lat) ? (
                                <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Met Location</Text>
                                        {!!selectedCard.location_lat ? (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (Platform.OS === 'web') {
                                                        window.open(`https://www.google.com/maps/search/?api=1&query=${selectedCard.location_lat},${selectedCard.location_lng}`, '_blank');
                                                    } else {
                                                        const url = Platform.select({
                                                            ios: `maps:0,0?q=${selectedCard.location_name || 'Meeting Point'}@${selectedCard.location_lat},${selectedCard.location_lng}`,
                                                            android: `geo:0,0?q=${selectedCard.location_lat},${selectedCard.location_lng}(${selectedCard.location_name || 'Meeting Point'})`,
                                                        });
                                                        Linking.openURL(url);
                                                    }
                                                }}
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                            >
                                                <Ionicons name="map-outline" size={14} color={theme.primary} />
                                                <Text style={{ fontSize: 10, color: theme.primary, fontWeight: 'bold' }}>VIEW ON MAP</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                        <Ionicons name="location-outline" size={18} color={theme.primary} style={{ marginRight: 10 }} />
                                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                                            {selectedCard.location_name || (selectedCard.location_lat ? `${Number(selectedCard.location_lat).toFixed(4)}, ${Number(selectedCard.location_lng).toFixed(4)}` : "Unavailable")}
                                        </Text>
                                    </View>
                                </View>
                            ) : null}

                            <DetailRow icon="call-outline" label="Phones" values={parseJSON(selectedCard.phones)} theme={theme} />
                            <DetailRow icon="mail-outline" label="Emails" values={parseJSON(selectedCard.emails)} theme={theme} />
                            <DetailRow icon="pin-outline" label="Addresses" values={parseJSON(selectedCard.addresses)} theme={theme} />
                            <DetailRow icon="globe-outline" label="Websites" values={parseJSON(selectedCard.websites)} theme={theme} />

                        </View>

                        {/* Action Buttons */}
                        <View style={{ marginTop: 20, gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.editBtn, { backgroundColor: theme.bg, borderColor: theme.primary }]}
                                onPress={() => startEditMode(selectedCard)}
                            >
                                <Feather name="edit-2" size={18} color={theme.primary} />
                                <Text style={[styles.editBtnText, { color: theme.primary }]}>Edit Card Details</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.deleteAccBtn, { backgroundColor: theme.bg, borderColor: theme.error }]}
                                onPress={() => {
                                    removeHistoryItem(selectedCard.id);
                                    setSelectedCard(null);
                                }}
                            >
                                <Ionicons name="trash-outline" size={20} color={theme.error} />
                                <Text style={[styles.deleteAccText, { color: theme.error }]}>Remove this card</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}
