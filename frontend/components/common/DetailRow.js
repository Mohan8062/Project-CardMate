import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

export const DetailRow = ({ icon, label, values, theme }) => {
    if (!values || values.length === 0) return null;
    return (
        <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
            {values.map((v, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: i > 0 ? 8 : 0 }}>
                    <Ionicons name={icon} size={18} color={theme.primary} style={{ marginRight: 10 }} />
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{v}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    detailItem: { padding: 18, borderBottomWidth: 1 },
    detailLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
    detailValue: { fontSize: 16, fontWeight: '600', lineHeight: 24, fontFamily: 'monospace' },
});
