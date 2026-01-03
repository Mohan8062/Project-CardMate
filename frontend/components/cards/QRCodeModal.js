import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateVCardData } from '../../utils/cardUtils';

export default function QRCodeModal({
    theme,
    styles,
    qrModalVisible,
    setQrModalVisible,
    ownerCard
}) {
    return (
        <Modal visible={qrModalVisible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.activeResultCard, { alignItems: 'center', padding: 30, backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Text style={[styles.resultTitle, { fontSize: 22, color: theme.textPrimary, marginBottom: 20 }]}>Share Contact</Text>

                    <View style={{ padding: 15, backgroundColor: '#fff', borderRadius: 20, elevation: 0, borderWidth: 1 }}>
                        <QRCode
                            value={ownerCard ? generateVCardData(ownerCard) : "No Data"}
                            size={220}
                            color="black"
                            backgroundColor="white"
                        />
                    </View>

                    <Text style={{ marginTop: 20, color: theme.textSecondary, textAlign: 'center', fontFamily: 'monospace' }}>
                        Scan to add {ownerCard?.name || "User"} to contacts
                    </Text>

                    <TouchableOpacity
                        style={[styles.scanBtnMain, { marginTop: 30, backgroundColor: theme.primary, width: '100%' }]}
                        onPress={() => setQrModalVisible(false)}
                    >
                        <Text style={styles.scanBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
