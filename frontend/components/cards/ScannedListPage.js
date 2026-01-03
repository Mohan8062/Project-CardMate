import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SkeletonItem } from '../common/SkeletonItem';

export default function ScannedListPage({
    theme,
    styles,
    loading,
    darkMode,
    searchQuery,
    setSearchQuery,
    loadHistory,
    filteredHistory,
    placeholderColor,
    setSelectedCard,
    removeHistoryItem
}) {
    const parseJSON = (str) => {
        try {
            return JSON.parse(str || "[]");
        } catch (e) {
            return [];
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Scanned Cards</Text>
                    <TouchableOpacity onPress={() => loadHistory()}>
                        <Ionicons name="refresh" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.searchBar, { borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} />
                    <TextInput
                        placeholder="Search collected cards"
                        placeholderTextColor={theme.textSecondary}
                        style={[styles.searchInput, { color: theme.textPrimary }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.historyList}>
                    <Text style={[styles.listSectionTitle, { color: theme.textSecondary }]}>
                        All Scanned Cards ({filteredHistory.length})
                    </Text>

                    {loading ? (
                        <View style={{ gap: 12 }}>
                            {[1, 2, 3, 4].map(i => <SkeletonItem key={i} darkMode={darkMode} />)}
                        </View>
                    ) : filteredHistory.length === 0 ? (
                        <View style={[styles.emptyState, { marginTop: 60 }]}>
                            <Ionicons name="library-outline" size={60} color={theme.border} />
                            <Text style={[styles.noOwnerText, { color: theme.textSecondary }]}>No scanned cards yet</Text>
                        </View>
                    ) : (
                        filteredHistory.map((item, index) => {
                            const phones = parseJSON(item.phones);
                            return (
                                <TouchableOpacity
                                    key={item.id || index}
                                    style={[
                                        styles.historyCard,
                                        { backgroundColor: theme.card, borderColor: theme.border },
                                        item.is_favorite && { borderColor: theme.accent, borderWidth: 1 }
                                    ]}
                                    onPress={() => setSelectedCard(item)}
                                >
                                    <View style={[styles.historyThumb, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                                        <Ionicons name="person" size={24} color={theme.textPrimary} />
                                        {item.is_favorite && (
                                            <View style={{ position: 'absolute', top: -5, right: -5 }}>
                                                <Ionicons name="star" size={14} color={theme.accent} />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.historyBody}>
                                        <Text style={[styles.historyName, { color: theme.textPrimary }]}>{item.name}</Text>
                                        <Text style={[styles.historyDetail, { color: theme.textSecondary }]}>
                                            {item.designation || (phones.length > 0 ? phones[0] : "—")}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                                            <Text style={[styles.historyDate, { color: theme.textSecondary, marginBottom: 0 }]}>
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </Text>
                                            {item.tags && parseJSON(item.tags).length > 0 && (
                                                <View style={{ backgroundColor: theme.primary, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 }}>
                                                    <Text style={{ fontSize: 8, color: theme.bg, fontWeight: 'bold', fontFamily: 'monospace' }}>
                                                        {parseJSON(item.tags)[0].toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={{ padding: 5 }}
                                        onPress={(e) => {
                                            e.preventDefault && e.preventDefault();
                                            e.stopPropagation && e.stopPropagation();
                                            removeHistoryItem(item.id);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={theme.error} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
