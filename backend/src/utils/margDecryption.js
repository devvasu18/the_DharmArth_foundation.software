const crypto = require('crypto');

/**
 * MARG ERP EDE Decryption Utility
 * Based on MARG ERP's 128-bit encryption standard.
 */
class MargDecryption {
    /**
     * Decrypts encrypted string from MARG ERP
     * @param {string} encryptedText - The text to decrypt
     * @param {string} key - Decryption key provided by MARG
     * @returns {Object|null} - Decrypted and parsed JSON object
     */
    static decrypt(encryptedText, key) {
        if (!encryptedText) return null;

        try {
            const zlib = require('zlib');
            const encryptedBuffer = Buffer.from(encryptedText, 'base64');
            
            // The MARG "encryption" appears to be Raw Deflate compression
            try {
                const decompressed = zlib.inflateRawSync(encryptedBuffer);
                const resultStr = decompressed.toString('utf8');
                // Remove potential BOM or garbage characters
                const cleanJson = resultStr.replace(/^\uFEFF/, '').trim();
                return JSON.parse(cleanJson);
            } catch (zlibError) {
                console.error('[MARG] Deflate Decompression failed, trying AES...');
            }

            // Fallback to AES if Deflate fails
            let secretKey = key;
            if (secretKey.length < 16) secretKey = secretKey.padEnd(16, ' ');
            else if (secretKey.length > 16) secretKey = secretKey.substring(0, 16);

            const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(secretKey), null);
            decipher.setAutoPadding(true);

            let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);
        } catch (error) {
            console.error('[MARG] Decryption/Decompression failed:', error.message);
            return null;
        }
    }
}

module.exports = MargDecryption;
