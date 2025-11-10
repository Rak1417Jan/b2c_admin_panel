// src/services/LoginApiServices.js
import { encryptText } from "../utils/cryptoService";

const BASE_URL = import.meta.env.VITE_API_BASE;

/**
 * Encrypts email using AES-256-CBC (CryptoJS)
 * and sends a secure login request to backend.
 * @param {string} email - plaintext email
 * @param {string} password - plaintext password
 * @returns {Promise<object>} - API JSON response
 */
export async function loginAdmin(email, password) {
  try {
    // Encrypt only the email before sending
    const encryptedEmail = encryptText(email, false);

    const payload = {
      email: encryptedEmail,
      password,
    };

    const response = await fetch(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    // Store token + admin name securely for later API calls
    if (data?.token) {
      localStorage.setItem("authToken", data.token);
      if (data.admin?.name) {
        localStorage.setItem("adminName", data.admin.name);
      }
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

/**
 * Clears authentication data (token + name) on logout.
 * Can be expanded to clear other items if required.
 */
export function logoutAdmin() {
  try {
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminName");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
}
