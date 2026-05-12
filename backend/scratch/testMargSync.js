require('dotenv').config();
const axios = require('axios');
const MargDecryption = require('../src/utils/margDecryption');

/**
 * MARG ERP Connection Test Script (Dry Run)
 * This script tests the API connection and decryption logic without writing to MongoDB.
 */
async function testMargConnection() {
    console.log('--- MARG ERP Connection Test Started ---');
    console.log(`Endpoint: ${process.env.MARG_EDE_POST_URL}`);
    console.log(`Company: ${process.env.MARG_COMPANY_CODE}`);

    try {
        console.log('0. Testing Masters GET API (No decryption needed)...');
        const mastersResp = await axios.get(`${process.env.MARG_MASTERS_GET_URL}?companycode=${process.env.MARG_COMPANY_CODE}`, { timeout: 20000 });
        console.log('Masters API Status:', mastersResp.data.Status);
        console.log('Masters API Sample Data:', JSON.stringify(mastersResp.data.Data).substring(0, 200));

        console.log('\n1. Sending POST request to MARG ERP...');
        const payload = {
            CompanyCode: process.env.MARG_COMPANY_CODE,
            Datetime: "", // Fetch everything for test
            MargKey: process.env.MARG_KEY,
            Index: 0,
            CompanyID: "7772",
            APIType: "2"
        };
        const response = await axios.post(process.env.MARG_EDE_POST_URL, payload, { 
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('2. Response received from MARG.');
        console.log(`Response Type: ${typeof response.data}`);
        console.log(`Response Snippet: ${JSON.stringify(response.data).substring(0, 200)}...`);
        
        // Handle if response is the encrypted string itself
        let encryptedData = null;
        if (typeof response.data === 'string') {
            encryptedData = response.data;
        } else if (response.data.Data) {
            encryptedData = response.data.Data;
        } else if (response.data.Status && response.data.Data === undefined) {
             console.log('Status found but Data is undefined.');
        } else if (Array.isArray(response.data)) {
            console.log('Response is an array of length:', response.data.length);
            encryptedData = response.data[0]; // Try first element
        } else if (response.data && typeof response.data === 'object') {
            // Check if it's an array-like object with numeric keys
            const keys = Object.keys(response.data);
            if (keys.includes('0')) {
                console.log('Detected array-like object with numeric keys.');
                // Convert to string if it looks like character codes or just join if strings
                encryptedData = Object.values(response.data).join('');
            }
        }

        console.log('3. Attempting to decrypt data...');
        const decrypted = MargDecryption.decrypt(encryptedData, process.env.MARG_DECRYPTION_KEY);

        if (!decrypted) {
            console.error('FAILED: Decryption returned null. Check the logs above for specific error.');
            return;
        }

        console.log('SUCCESS: Data decrypted successfully!');
        
        // Show summary of decrypted data
        const collections = ['Details', 'Masters', 'MDis', 'Party', 'Product', 'SaleType', 'Stock'];
        let hasRecords = false;
        
        console.log('\n--- Decrypted Data Summary ---');
        collections.forEach(key => {
            const records = decrypted[key] || (decrypted.Details && decrypted.Details[key]) || [];
            if (records.length > 0) {
                hasRecords = true;
                console.log(`${key}: ${records.length} records`);
                console.log(`   Sample ${key} Record:`, JSON.stringify(records[0], null, 2).substring(0, 200) + '...');
            }
        });

        if (!hasRecords) {
            console.log('No data records found in decrypted object.');
            console.log('Full Decrypted Object:', JSON.stringify(decrypted, null, 2));
        }

        console.log('\n--- Test Completed Successfully ---');
        console.log('Note: No data was written to the database.');

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testMargConnection();
