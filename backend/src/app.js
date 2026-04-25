const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(express.json({
    limit: '10kb', // Prevent "Billion Laughs" / Large Payload DoS
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean),
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
const path = require('path');
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const donationRoutes = require('./routes/donationRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const roleRoutes = require('./routes/roleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const eventRoutes = require('./routes/eventRoutes');
const eventHeaderRoutes = require('./routes/eventHeaderRoutes');

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Health check for UptimeRobot
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/donate', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/transactions', transactionRoutes);
app.use('/api/payment', paymentRoutes);

app.use('/api/events', eventRoutes);
app.use('/api/event-headers', eventHeaderRoutes);
app.use('/api/event-videos', require('../routes/eventVideoRoutes'));
app.use('/api/galleries', require('../routes/galleryRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/availability', require('./routes/availabilityRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payouts', require('./routes/payoutRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
