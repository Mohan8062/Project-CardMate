import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, Animated } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

export default function EventModal({
    visible,
    onClose,
    onSave,
    theme
}) {
    const [eventName, setEventName] = useState("");

    const handleSave = () => {
        if (eventName.trim()) {
            onSave(eventName.trim());
            setEventName("");
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[styles.modalBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={styles.header}>
                        <Ionicons name="flash" size={20} color={theme.primary} />
                        <Text style={[styles.title, { color: theme.textPrimary }]}>CONFERENCE MODE</Text>
                    </View>

                    <Text style={[styles.description, { color: theme.textSecondary }]}>
                        Enter the event name to automatically tag all scanned cards.
                    </Text>

                    <TextInput
                        style={[styles.input, { backgroundColor: theme.secondary, color: theme.textPrimary, borderColor: theme.border }]}
                        value={eventName}
                        onChangeText={setEventName}
                        placeholder="e.g. CES 2026, TechCrunch..."
                        placeholderTextColor={theme.textSecondary}
                        autoFocus
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={[styles.btnText, { color: theme.textSecondary }]}>CANCEL</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
                            <Text style={[styles.btnText, { color: theme.bg }]}>START MODE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalBox: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15
    },
    title: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
        fontFamily: 'monospace'
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20
    },
    input: {
        height: 55,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 25,
        fontFamily: 'monospace'
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 15
    },
    cancelBtn: {
        padding: 15
    },
    saveBtn: {
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 12,
    },
    btnText: {
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 1,
        fontFamily: 'monospace'
    }
});
