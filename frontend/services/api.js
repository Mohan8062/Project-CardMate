// frontend/services/api.js
import axios from "axios";
import { Platform } from "react-native";

// 🔥 Replace this with your PC's LAN IP
const BASE_URL = "http://10.74.211.86:5000";
 // <-- change to your IPv4

/**
 * Send selected image to OCR backend
 * @param {string} imageUri - URI of image from ImagePicker
 * @returns {object} OCR result or error
 */
export const sendCardToOCR = async (imageUri) => {
  try {
    const formData = new FormData();

    let uri = imageUri;

    // On Android, the uri starts with "file://"
    if (Platform.OS === "android" && !uri.startsWith("file://")) {
      uri = "file://" + uri;
    }

    formData.append("file", {
      uri,
      type: "image/jpeg", // adjust if needed
      name: "upload.jpg",
    });

    const response = await axios.post(`${BASE_URL}/ocr`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 15000, // 15 seconds timeout
    });

    return response.data.data;
  } catch (error) {
    console.error("OCR API Error:", error.message || error);
    return {
      error:
        "Unable to reach OCR API. Make sure your backend is running and your device/emulator is on the same network.",
    };
  }
};
