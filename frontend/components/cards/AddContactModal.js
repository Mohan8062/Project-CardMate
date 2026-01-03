import React from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

export default function AddContactModal({
    theme,
    styles,
    modalVisible,
    setModalVisible,
    pickFromGallery,
    setCameraOpen
}) {
    return (
        <Modal visible={modalVisible} animationType="slide" transparent>
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setModalVisible(false)}
            >
                <View style={[styles.bottomSheet, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <View style={[styles.sheetHandle, { backgroundColor: theme.textSecondary }]} />
                    <Text style={[styles.sheetHeader, { color: theme.textPrimary }]}>Add contact...</Text>

                    <TouchableOpacity style={[styles.sheetButton, { borderBottomColor: theme.border }]} onPress={() => { setModalVisible(false); setCameraOpen(true); }}>
                        <View style={styles.sheetIconBox}>
                            <Ionicons name="camera" size={22} color={theme.textPrimary} />
                        </View>
                        <Text style={[styles.sheetButtonText, { color: theme.textPrimary }]}>Scan card or QR code</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.sheetButton, { borderBottomColor: theme.border }]} onPress={pickFromGallery}>
                        <View style={styles.sheetIconBox}>
                            <Ionicons name="images" size={22} color={theme.textPrimary} />
                        </View>
                        <Text style={[styles.sheetButtonText, { color: theme.textPrimary }]}>Upload from Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.sheetButton, { borderBottomColor: theme.border }]} onPress={() => Alert.alert("NFC", "NFC Scan initiated...")}>
                        <View style={styles.sheetIconBox}>
                            <MaterialCommunityIcons name="credit-card-wireless" size={22} color={theme.textPrimary} />
                        </View>
                        <Text style={[styles.sheetButtonText, { color: theme.textPrimary }]}>Scan NFC tag</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.sheetButton, { borderBottomWidth: 0, borderBottomColor: theme.border }]} onPress={() => Alert.alert("Manual", "Enter details manually...")}>
                        <View style={styles.sheetIconBox}>
                            <FontAwesome5 name="pen" size={18} color={theme.textPrimary} />
                        </View>
                        <Text style={[styles.sheetButtonText, { color: theme.textPrimary }]}>Enter manually</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}
