import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './services/api';
import CardPicker from './components/CardPicker';
import AuthScreen from './components/AuthScreen';
import { THEME } from './theme';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkLoggedIn();
  }, []);

  const checkLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');

      if (token && userDataStr) {
        // Optional: Verify token with backend to ensure it's still valid
        const validUser = await getCurrentUser();
        if (validUser) {
          setUser(JSON.parse(userDataStr));
        } else {
          // Token invalid or session expired
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          setUser(null);
        }
      }
    } catch (e) {
      console.warn("Auth check failed", e);
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    setUser(null);
    // Note: Actual cleanup happens in api.js logoutUser, 
    // but we can add a helper here if needed.
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {user ? (
        <CardPicker user={user} onLogout={handleLogout} />
      ) : (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.light.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.light.bg
  }
});
