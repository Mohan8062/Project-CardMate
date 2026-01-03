import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

export default function EditCardModal({
    theme,
    styles,
    editMode,
    setEditMode,
    editData,
    setEditData,
    saveCardEdit
}) {
    return (
        <Modal visible={editMode} animationType="slide">
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
                <View style={[styles.headerContainer, { paddingBottom: 15, backgroundColor: theme.bg, borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => setEditMode(false)}>
                            <Ionicons name="close" size={28} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { fontSize: 20 }]}>Edit Card</Text>
                        <TouchableOpacity onPress={saveCardEdit}>
                            <Ionicons name="checkmark" size={28} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={{ flex: 1, padding: 20 }}>
                    <View style={styles.editFormGroup}>
                        <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Name</Text>
                        <TextInput
                            style={[styles.editInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary }]}
                            value={editData.name}
                            onChangeText={(t) => setEditData({ ...editData, name: t })}
                            placeholder="Full Name"
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>

                    <View style={styles.editFormGroup}>
                        <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Designation</Text>
                        <TextInput
                            style={[styles.editInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary }]}
                            value={editData.designation}
                            onChangeText={(t) => setEditData({ ...editData, designation: t })}
                            placeholder="Job Title"
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>

                    <View style={styles.editFormGroup}>
                        <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Company</Text>
                        <TextInput
                            style={[styles.editInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary }]}
                            value={editData.company}
                            onChangeText={(t) => setEditData({ ...editData, company: t })}
                            placeholder="Company Name"
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>

                    <View style={styles.editFormGroup}>
                        <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Phones (comma separated)</Text>
                        <TextInput
                            style={[styles.editInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary }]}
                            value={editData.phones}
                            onChangeText={(t) => setEditData({ ...editData, phones: t })}
                            placeholder="9876543210, 8765432109"
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>

                    <View style={styles.editFormGroup}>
                        <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Emails (comma separated)</Text>
                        <TextInput
                            style={[styles.editInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary }]}
                            value={editData.emails}
                            onChangeText={(t) => setEditData({ ...editData, emails: t })}
                            placeholder="email@example.com"
                            placeholderTextColor={theme.textSecondary}
                        />
                    </View>

                    <View style={styles.editFormGroup}>
                        <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Notes</Text>
                        <TextInput
                            style={[styles.editInput, { height: 100, textAlignVertical: 'top', backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary }]}
                            value={editData.notes}
                            onChangeText={(t) => setEditData({ ...editData, notes: t })}
                            placeholder="Add personal notes about this contact..."
                            placeholderTextColor={theme.textSecondary}
                            multiline
                        />
                    </View>

                    <TouchableOpacity style={[styles.saveEditBtn, { backgroundColor: theme.primary }]} onPress={saveCardEdit}>
                        <Text style={styles.saveEditBtnText}>Save Changes</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}
