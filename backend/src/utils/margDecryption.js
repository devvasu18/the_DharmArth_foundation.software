const crypto = require('crypto');
const zlib = require('zlib');

/**
 * MARG ERP EDE Decryption Utility
 * Implements 128-bit AES-CBC Decryption and Raw Deflate Decompression
 * based on official MARG ERP "EDE - Electronic Data Exchange" standard.
 */
class MargDecryption {
    /**
     * Decrypts and decompresses encrypted string from MARG ERP
     * @param {string|Object} encryptedData - The encrypted response from MARG API
     * @param {string} key - Decryption key provided by MARG
     * @returns {Object|null} - Decrypted and parsed JSON object
     */
    static decrypt(encryptedData, key) {
        if (!encryptedData) return null;

        // If it's already an object (e.g. unencrypted response or error)
        if (typeof encryptedData === 'object') {
            if (encryptedData.Data && typeof encryptedData.Data === 'string') {
                return MargDecryption.decrypt(encryptedData.Data, key);
            }
            return encryptedData;
        }

        const rawString = String(encryptedData).trim();
        // If it's already raw JSON
        if (rawString.startsWith('{') || rawString.startsWith('[')) {
            try {
                return JSON.parse(rawString);
            } catch (e) {
                // Continue to decryption
            }
        }

        try {
            // Step 1: AES-128-CBC Decryption
            // Key preparation: 16-byte buffer padded with 0x00, IV is identical to Key
            const keyBuf = Buffer.alloc(16, 0);
            if (key) {
                const pwdBytes = Buffer.from(String(key).trim(), 'utf8');
                pwdBytes.copy(keyBuf, 0, 0, Math.min(pwdBytes.length, 16));
            }

            const cleanedCipher = rawString.replace(/\s+/g, '');
            const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuf, keyBuf);
            decipher.setAutoPadding(true);

            let decryptedBase64 = decipher.update(cleanedCipher, 'base64', 'utf8');
            decryptedBase64 += decipher.final('utf8');

            // Step 2: Raw Deflate Decompression
            const compressedBuffer = Buffer.from(decryptedBase64.trim(), 'base64');
            let jsonString = '';

            try {
                // In .NET DeflateStream is raw deflate (no zlib headers)
                jsonString = zlib.inflateRawSync(compressedBuffer).toString('utf8');
            } catch (inflateRawError) {
                // Fallback to standard zlib inflate if headers are present
                try {
                    jsonString = zlib.inflateSync(compressedBuffer).toString('utf8');
                } catch (inflateError) {
                    // Or check if the decrypted string was directly UTF-8 text
                    jsonString = decryptedBase64;
                }
            }

            // Remove UTF-8 Byte Order Mark (BOM) if present and trim
            const cleanJson = jsonString.replace(/^\uFEFF/, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('[MARG] Decryption/Decompression failed:', error.message);
            return null;
        }
    }
}

module.exports = MargDecryption;
