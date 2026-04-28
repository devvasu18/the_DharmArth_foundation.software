require('dotenv').config(); // Load environment variables
const app = require('./src/app');
const connectDB = require('./src/config/db');

const http = require('http');
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    // Basic join room logic
    socket.on('join_admin_notifications', () => {
        socket.join('admin_notifications');
    });

    socket.on('join_user_notifications', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
        }
    });
});

const PORT = process.env.PORT || 5000;

console.log('--- SYSTEM CONFIGURATION ---');
console.log(`[CONFIG] Node Env: ${process.env.NODE_ENV}`);
console.log(`[CONFIG] WhatsApp URL: ${process.env.WHATSAPP_SERVICE_URL || 'DEFAULT (localhost:10000)'}`);
console.log(`[CONFIG] WhatsApp Key: ${process.env.WHATSAPP_SERVICE_API_KEY ? 'LOADED (Safe)' : 'MISSING ⚠️'}`);
console.log(`[CONFIG] Razorpay Key: ${process.env.RAZORPAY_KEY_ID ? 'LOADED' : 'MISSING ⚠️'}`);
console.log('---------------------------');

connectDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
});
