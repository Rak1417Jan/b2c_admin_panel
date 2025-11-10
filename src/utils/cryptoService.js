import CryptoJS from "crypto-js";

/* -------------------------------------------------------------------------- */
/*                               AES CONSTANTS                                */
/* -------------------------------------------------------------------------- */
export const AES_KEY = "7E892875A52C59A3B588306B13C31FBD";
export const AES_IV = "XYE45DKJ0967GFAZ";

/* -------------------------------------------------------------------------- */
/*                          ENCRYPT / DECRYPT HELPERS                         */
/* -------------------------------------------------------------------------- */

/**
 * Encrypt text using AES-256-CBC (PKCS7 padding)
 * @param {string} plainText - text to encrypt
 * @param {boolean} encode - whether to URL-encode the Base64 output
 * @returns {string} Base64 or URL-encoded ciphertext
 */
export const encryptText = (plainText, encode = false) => {
  if (!plainText) return "";
  const key = CryptoJS.enc.Utf8.parse(AES_KEY);
  const iv = CryptoJS.enc.Utf8.parse(AES_IV);

  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const base64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  return encode ? encodeURIComponent(base64) : base64;
};

/**
 * Decrypt AES-256-CBC text
 * @param {string} cipherText - Base64 or URL-encoded cipher
 * @param {boolean} decode - whether to URL-decode before decrypting
 * @returns {string|null} UTF-8 plaintext
 */
export const decryptText = (cipherText, decode = false) => {
  try {
    if (!cipherText) return null;
    const key = CryptoJS.enc.Utf8.parse(AES_KEY);
    const iv = CryptoJS.enc.Utf8.parse(AES_IV);
    const decoded = decode ? decodeURIComponent(cipherText) : cipherText;

    const cipherBytes = CryptoJS.enc.Base64.parse(decoded);
    const decrypted = CryptoJS.AES.decrypt({ ciphertext: cipherBytes }, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                           LOCAL STORAGE HELPERS                            */
/* -------------------------------------------------------------------------- */

/**
 * Store any data securely in localStorage
 * @param {string} key - storage key
 * @param {object|string} data - value to store (object will be stringified)
 * @returns {boolean}
 */
export const storeItem = (key, data) => {
  try {
    if (!key || data === undefined || data === null) {
      throw new Error("Invalid key or data");
    }

    const value = typeof data === "string" ? data : JSON.stringify(data);
    const encrypted = encryptText(value);
    localStorage.setItem(key, encrypted);
    return true;
  } catch (err) {
    console.error("Failed to store item:", err);
    return false;
  }
};

/**
 * Retrieve and decrypt stored item
 * @param {string} key - storage key
 * @param {boolean} parseJson - whether to parse JSON if applicable
 * @returns {string|object|null}
 */
export const getStoredItem = (key, parseJson = true) => {
  try {
    const cipher = localStorage.getItem(key);
    if (!cipher) return null;

    const decrypted = decryptText(cipher);
    if (!decrypted) return null;

    return parseJson ? JSON.parse(decrypted) : decrypted;
  } catch {
    return null;
  }
};

/**
 * Remove a specific key from localStorage
 * @param {string} key
 */
export const removeStoredItem = (key) => {
  localStorage.removeItem(key);
};

/**
 * Clear entire localStorage (optional: keep certain keys)
 * @param {string[]} keepKeys
 */
export const clearStorage = (keepKeys = []) => {
  const preserved = {};

  // ✅ replaced forEach with for...of
  for (const k of keepKeys) {
    const val = localStorage.getItem(k);
    if (val) {
      preserved[k] = val;
    }
  }

  localStorage.clear();

  // ✅ replaced Object.entries().forEach with for...of
  for (const [k, v] of Object.entries(preserved)) {
    localStorage.setItem(k, v);
  }
};
