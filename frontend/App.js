import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CardPicker from './components/CardPicker';
import AuthScreen from './components/AuthScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkLoggedIn();
  }, []);

  const checkLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.warn("Auth check failed", e);
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
        <CardPicker />
      ) : (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  }
});
