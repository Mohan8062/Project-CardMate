import React, { useRef } from 'react';
import { Animated, TouchableOpacity, View, StyleSheet } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function FAB({ activeTab, onPress, theme }) {
    const fabScale = useRef(new Animated.Value(1)).current;

    if (activeTab === "scan") return null;

    return (
        <Animated.View
            style={[
                styles.fabBtn,
                { transform: [{ scale: fabScale }] }
            ]}
        >
            <TouchableOpacity
                style={styles.fabTouchable}
                onPress={onPress}
                activeOpacity={0.8}
                onPressIn={() => Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }).start()}
            >
                <LinearGradient
                    colors={theme.primaryGradient}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={32} color={theme.bg} />
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    fabBtn: {
        position: 'absolute',
        bottom: 100,
        right: 25,
        zIndex: 100,
    },
    fabTouchable: {
        width: 60,
        height: 60,
        borderRadius: 30,
        elevation: 0,
        borderWidth: 2,
        borderColor: '#fff',
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
