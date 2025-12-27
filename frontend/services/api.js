// frontend/services/api.js
import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.167.25.86:8000";

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

// --- Helper for authenticated requests ---
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("userToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Business Card Functions ---

export const sendCardToOCR = async (imageUri) => {
  try {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    let uri = imageUri;
    if (Platform.OS === "android" && !uri.startsWith("file://")) {
      uri = "file://" + uri;
    }

    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: "upload.jpg",
    });

    const response = await axios.post(`${BASE_URL}/scan`, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
      timeout: 20000,
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
    console.error("Fetch Cards Error:", error);
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
