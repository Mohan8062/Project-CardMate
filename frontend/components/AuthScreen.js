import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { loginUser, registerUser } from "../services/api";

export default function AuthScreen({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.inner}
            >
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Ionicons name="card" size={50} color="#fff" />
                    </View>
                    <Text style={styles.logoText}>CardMate</Text>
                    <Text style={styles.logoSub}>Your business network, organized.</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>{isLogin ? "Welcome Back" : "Create Account"}</Text>

                    {!isLogin && (
                        <View style={styles.inputGroup}>
                            <Ionicons name="person-outline" size={20} color="#94A3B8" />
                            <TextInput
                                placeholder="Full Name"
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                        <TextInput
                            placeholder="Email Address"
                            style={styles.input}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                        <TextInput
                            placeholder="Password"
                            style={styles.input}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity style={styles.mainBtn} onPress={handleAuth} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.mainBtnText}>{isLogin ? "LOG IN" : "SIGN UP"}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.toggleBtn}
                        onPress={() => setIsLogin(!isLogin)}
                    >
                        <Text style={styles.toggleText}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <Text style={styles.toggleBold}>{isLogin ? "Sign Up" : "Log In"}</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#1E3A8A" },
    inner: { flex: 1, padding: 30, justifyContent: "center" },
    logoContainer: { alignItems: "center", marginBottom: 40 },
    logoIcon: { width: 90, height: 90, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    logoText: { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: 1 },
    logoSub: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 5 },

    formCard: { backgroundColor: "#fff", borderRadius: 30, padding: 30, elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 15 },
    formTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B", marginBottom: 25, textAlign: "center" },

    inputGroup: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1, borderColor: "#E2E8F0"
    },
    input: { flex: 1, paddingVertical: 15, marginLeft: 10, color: "#1E293B", fontSize: 16 },

    mainBtn: { backgroundColor: "#1E3A8A", paddingVertical: 18, borderRadius: 15, marginTop: 10, alignItems: "center" },
    mainBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 1 },

    toggleBtn: { marginTop: 20, alignItems: "center" },
    toggleText: { color: "#64748B", fontSize: 14 },
    toggleBold: { color: "#1E3A8A", fontWeight: "700" }
});
