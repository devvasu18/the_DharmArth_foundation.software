/**
 * Sanitizes user input to prevent XSS, Phishing, and Memory exhaustion.
 */
const sanitizeString = (str, maxLength = 255) => {
    if (typeof str !== 'string') return '';
    
    return str
        .trim()
        .slice(0, maxLength) // Prevent Memory Bomb
        .replace(/<[^>]*>?/gm, '') // Strip HTML tags
        .replace(/https?:\/\/[^\s]+/g, '[LINK REMOVED]') // Prevent Phishing links
        .replace(/[^\w\s@.,-]/gi, ''); // Allow only safe characters
};

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { sanitizeString, escapeRegex };
