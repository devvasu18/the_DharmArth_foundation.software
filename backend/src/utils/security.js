const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// This should be a 32-character key from .env.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY is missing in production environment variables!');
}
// For development, we can derive a key if missing, but it's better to log a warning
if (!ENCRYPTION_KEY) {
    console.warn('⚠️ WARNING: ENCRYPTION_KEY is missing. Using a temporary insecure key for development.');
}

const FINAL_KEY = ENCRYPTION_KEY || 'df80g_dev_fallback_key_32chars_!!';
const IV_LENGTH = 16; 

/**
 * Encrypts a string
 */
function encrypt(text) {
    if (!text) return text;
    if (String(text).includes(':')) return text; 
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(FINAL_KEY.slice(0, 32)), iv);
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
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(FINAL_KEY.slice(0, 32)), iv);
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
