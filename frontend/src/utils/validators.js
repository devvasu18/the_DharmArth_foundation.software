
// Verhoeff Algorithm to validate Aadhaar Number (Verhoeff Checksum)
// Based on the Verhoeff algorithm used by UIDAI.

const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates an Aadhaar Number using the Verhoeff algorithm.
 * @param {string} aadhaarStr 
 * @returns {boolean}
 */
export const validateAadhaar = (aadhaarStr) => {
    if (!aadhaarStr || !/^\d{12}$/.test(aadhaarStr)) {
        return false;
    }

    let c = 0;
    let invertedArray = aadhaarStr.split('').map(Number).reverse();

    invertedArray.forEach((val, i) => {
        c = d[c][p[i % 8][val]];
    });

    return c === 0;
};

/**
 * Validates a PAN Card Number using Regex.
 * Format: 5 Letters, 4 Digits, 1 Letter (e.g., ABCDE1234F)
 * @param {string} pan 
 * @returns {boolean}
 */
export const validatePAN = (pan) => {
    if (!pan) return false;
    // Standard PAN Regex
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
};
