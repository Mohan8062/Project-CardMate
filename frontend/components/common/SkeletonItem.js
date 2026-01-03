import React from 'react';
import { View, StyleSheet } from 'react-native';

export const SkeletonItem = ({ darkMode }) => (
    <View style={[styles.skeletonContainer, darkMode && { backgroundColor: '#1E293B' }]} >
        <View style={[styles.skeletonThumb, darkMode && { backgroundColor: '#334155' }]} />
        <View style={styles.skeletonBody}>
            <View style={[styles.skeletonLine, { width: '60%' }, darkMode && { backgroundColor: '#334155' }]} />
            <View style={[styles.skeletonLine, { width: '40%', height: 10 }, darkMode && { backgroundColor: '#475569' }]} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeletonContainer: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#F3F4F6'
    },
    skeletonThumb: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#E5E7EB'
    },
    skeletonBody: {
        flex: 1,
        marginLeft: 16,
        gap: 10,
    },
    skeletonLine: {
        height: 16,
        borderRadius: 8,
        backgroundColor: '#E5E7EB'
    },
});
