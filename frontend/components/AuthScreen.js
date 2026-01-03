import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    SafeAreaView,
    Animated,
    Dimensions,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { loginUser, registerUser } from "../services/api";
import { THEME } from "../theme";

const { width, height } = Dimensions.get("window");

export default function AuthScreen({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, [isLogin]);

    const handleAuth = async () => {
        if (!email || !password || (!isLogin && !username)) {
            Alert.alert("Missing Fields", "Please fill in all required fields.");
            return;
        }

        setLoading(true);
        try {
            let data;
            if (isLogin) {
                data = await loginUser(email, password);
            } else {
                data = await registerUser(username, email, password);
            }
            onLoginSuccess(data.user);
        } catch (err) {
            Alert.alert("Auth Failed", err.message);
        } finally {
            setLoading(false);
        }
    };

    const theme = THEME.dark; // Use dark theme for Auth for that premium look

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Background Glows */}
            <View style={styles.backgroundGlow} />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.inner}
                >
                    <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.header}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="card" size={40} color="#fff" />
                            </View>
                            <Text style={styles.logoTitle}>CARDMATE</Text>
                            <Text style={styles.logoTagline}>CONNECT. SCAN. NETWORK.</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <Text style={styles.welcomeText}>
                                {isLogin ? "Welcome Back" : "Create Account"}
                            </Text>

                            {!isLogin && (
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>FULL NAME</Text>
                                    <View style={styles.inputGroup}>
                                        <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
                                        <TextInput
                                            placeholder="Enter your name"
                                            placeholderTextColor="#444"
                                            style={styles.input}
                                            value={username}
                                            onChangeText={setUsername}
                                        />
                                    </View>
                                </View>
                            )}

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                                <View style={styles.inputGroup}>
                                    <Ionicons name="mail-outline" size={18} color={theme.textSecondary} />
                                    <TextInput
                                        placeholder="your@email.com"
                                        placeholderTextColor="#444"
                                        style={styles.input}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>PASSWORD</Text>
                                <View style={styles.inputGroup}>
                                    <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} />
                                    <TextInput
                                        placeholder="••••••••"
                                        placeholderTextColor="#444"
                                        style={styles.input}
                                        secureTextEntry
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.mainBtn, loading && { opacity: 0.7 }]}
                                onPress={handleAuth}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#D71921', '#A31219']}
                                    style={styles.gradientBtn}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.mainBtnText}>{isLogin ? "CONTINUE" : "SIGN UP"}</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.toggleBtn}
                                onPress={() => setIsLogin(!isLogin)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.toggleText}>
                                    {isLogin ? "Need an account? " : "Already registered? "}
                                    <Text style={styles.toggleBold}>{isLogin ? "Sign Up" : "Log In"}</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    backgroundGlow: {
        position: 'absolute',
        top: -height * 0.2,
        right: -width * 0.2,
        width: width * 1.5,
        height: width * 1.5,
        backgroundColor: 'rgba(215, 25, 33, 0.05)',
        borderRadius: width,
    },
    inner: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },

    header: { alignItems: 'center', marginBottom: 50 },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: "#D71921",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    logoTitle: {
        color: '#fff',
        fontSize: 36,
        fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'monospace',
        fontWeight: '900',
        letterSpacing: 4,
    },
    logoTagline: {
        color: '#666',
        fontSize: 10,
        letterSpacing: 3,
        marginTop: 5,
        fontWeight: '700',
    },

    formContainer: {
        backgroundColor: 'rgba(20, 20, 20, 0.8)',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
    },
    welcomeText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 30,
        textAlign: 'center',
    },

    inputWrapper: { marginBottom: 20 },
    inputLabel: {
        color: '#444',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputGroup: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#080808",
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#1a1a1a",
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        marginLeft: 12,
        color: "#fff",
        fontSize: 15,
        fontWeight: '500',
    },

    mainBtn: { marginTop: 10, borderRadius: 16, overflow: 'hidden' },
    gradientBtn: {
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    mainBtnText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 14,
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'monospace',
    },

    toggleBtn: { marginTop: 25, alignItems: "center" },
    toggleText: { color: "#666", fontSize: 13, fontWeight: '500' },
    toggleBold: { color: "#fff", fontWeight: "700" }
});
