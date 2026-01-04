// frontend/services/api.js
import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use localhost for web browser, network IP for mobile devices
const BASE_URL = Platform.OS === "web"
  ? "http://localhost:8000"
  : "http://10.167.25.86:8000";

// --- Authentication Functions ---

/**
 * Register a new user
 */
export const registerUser = async (username, email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, {
      username,
      email,
      password,
    });
    if (response.data.access_token) {
      await AsyncStorage.setItem("userToken", response.data.access_token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error("Register Error:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || "Registration failed");
  }
};

/**
 * Login existing user
 */
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      email,
      password,
    });
    if (response.data.access_token) {
      await AsyncStorage.setItem("userToken", response.data.access_token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error("Login Error:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || "Login failed");
  }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  await AsyncStorage.removeItem("userToken");
  await AsyncStorage.removeItem("userData");
};

/**
 * Delete User Account
 */
export const deleteAccount = async () => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${BASE_URL}/users/me`, { headers });
    await logoutUser();
    return true;
  } catch (error) {
    console.error("Delete Account Error:", error);
    throw new Error(error.response?.data?.detail || "Failed to delete account");
  }
};

// --- Helper for authenticated requests ---
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("userToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Business Card Functions ---

export const sendCardToOCR = async (imageUri, extraParams = {}) => {
  try {
    const headers = await getAuthHeaders();
    const formData = new FormData();

    if (Platform.OS === "web") {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append("file", blob, "upload.jpg");
    } else {
      let uri = imageUri;
      if (Platform.OS === "android" && !uri.startsWith("file://")) {
        uri = "file://" + uri;
      }
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: "upload.jpg",
      });
    }

    if (extraParams.eventName) formData.append("event_name", extraParams.eventName);
    if (extraParams.lat) formData.append("location_lat", extraParams.lat.toString());
    if (extraParams.lng) formData.append("location_lng", extraParams.lng.toString());
    if (extraParams.locationName) formData.append("location_name", extraParams.locationName);

    const response = await axios.post(`${BASE_URL}/scan`, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    });

    return response.data.data;
  } catch (error) {
    console.error("OCR API Error:", error.message || error);
    return {
      error: error.response?.data?.detail || "Unable to reach OCR API.",
    };
  }
};

export const getAllCards = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/cards`, { headers });
    return response.data;
  } catch (error) {
    if (error.response?.status !== 401) {
      console.error("Fetch Cards Error:", error);
    }
    return [];
  }
};

export const deleteCard = async (cardId) => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${BASE_URL}/cards/${cardId}`, { headers });
    return true;
  } catch (error) {
    console.error("Delete Card Error:", error);
    return false;
  }
};

export const clearAllCards = async () => {
  try {
    const headers = await getAuthHeaders();
    await axios.post(`${BASE_URL}/cards/clear`, {}, { headers });
    return true;
  } catch (error) {
    console.error("Clear All Error:", error);
    return false;
  }
};

export const setCardAsOwner = async (cardId) => {
  try {
    const headers = await getAuthHeaders();
    await axios.post(`${BASE_URL}/cards/${cardId}/set-owner`, {}, { headers });
    return true;
  } catch (error) {
    console.error("Set Owner Error:", error);
    return false;
  }
};

// --- New Feature APIs ---

export const updateCard = async (cardId, cardData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${BASE_URL}/cards/${cardId}`, cardData, { headers });
    return response.data.data;
  } catch (error) {
    console.error("Update Card Error:", error);
    return null;
  }
};

export const createCard = async (cardData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/cards`, cardData, { headers });
    return response.data.data;
  } catch (error) {
    console.error("Create Card Error:", error);
    return null;
  }
};

export const toggleFavorite = async (cardId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/cards/${cardId}/favorite`, {}, { headers });
    return response.data.is_favorite;
  } catch (error) {
    console.error("Toggle Favorite Error:", error);
    return null;
  }
};

export const exportVCard = async (cardId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/cards/${cardId}/vcard`, {
      headers,
      responseType: Platform.OS === 'web' ? 'blob' : 'text'
    });
    return response.data;
  } catch (error) {
    console.error("Export vCard Error:", error);
    return null;
  }
};

export const updateUserSettings = async (settings) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${BASE_URL}/users/me/settings`, settings, { headers });
    return response.data;
  } catch (error) {
    console.error("Update Settings Error:", error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/users/me`, { headers });
    return response.data;
  } catch (error) {
    if (error.response?.status !== 401) {
      console.error("Get User Error:", error);
    }
    return null;
  }
};
