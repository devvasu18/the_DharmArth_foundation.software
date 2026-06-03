const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');

const WHATSAPP_SERVICE_URL = (process.env.WHATSAPP_SERVICE_URL || 'http://44.203.78.96:10000')
    .replace('http://http://', 'http://')
    .replace('/:10000', ':10000');
const WHATSAPP_SERVICE_API_KEY = process.env.WHATSAPP_SERVICE_API_KEY || 'df_ws_auth_6f8b9e2c4a1d3c5b7e9f0a2b4c6d8e0f';

// Helper to make requests to the WhatsApp Service backend
const whatsappRequest = async (method, path, body = null) => {
    const url = `${WHATSAPP_SERVICE_URL}${path}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': WHATSAPP_SERVICE_API_KEY,
            'bypass-tunnel-reminder': 'true',
            'ngrok-skip-browser-warning': 'true'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = { message: await response.text() };
    }
    
    if (!response.ok) {
        const error = new Error(data.message || 'Error from WhatsApp Service');
        error.status = response.status;
        error.data = data;
        throw error;
    }
    
    return data;
};

// Route to get status of a session
router.get('/status/:sessionId', protect, adminOnly, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const data = await whatsappRequest('GET', `/status/${sessionId}`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching WhatsApp status from service:', error.message);
        res.status(error.status || 500).json(error.data || {
            message: error.message || 'Error fetching WhatsApp status'
        });
    }
});

// Route to reconnect a session
router.post('/reconnect', protect, adminOnly, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const data = await whatsappRequest('POST', '/reconnect', { sessionId });
        res.json(data);
    } catch (error) {
        console.error('Error sending reconnect to WhatsApp service:', error.message);
        res.status(error.status || 500).json(error.data || {
            message: error.message || 'Error reconnecting session'
        });
    }
});

// Route to delete a session
router.delete('/session/:sessionId', protect, adminOnly, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const data = await whatsappRequest('DELETE', `/session/${sessionId}`);
        res.json(data);
    } catch (error) {
        console.error('Error deleting WhatsApp session:', error.message);
        res.status(error.status || 500).json(error.data || {
            message: error.message || 'Error deleting session'
        });
    }
});

module.exports = router;
