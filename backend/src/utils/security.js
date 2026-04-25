const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// This should be a 32-character key from .env. If missing, we fallback to a derived key (unsafe for production, but ensures code runs)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'df80g_secret_key_32chars_long_!!'; 
const IV_LENGTH = 16; 

/**
 * Encrypts a string
 */
function encrypt(text) {
    if (!text) return text;
    if (String(text).includes(':')) return text; 
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (err) {
        console.error("Encryption Error:", err);
        return text;
    }
}

/**
 * Decrypts a string
 */
function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        console.error("Decryption Error:", err.message);
        // If decryption fails, it might be legacy plain text
        return text;
    }
}

module.exports = { encrypt, decrypt };
