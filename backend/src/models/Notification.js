const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['DONATION', 'SYSTEM', 'USER', 'COMMISSION_EARNED', 'SUBSCRIPTION_STOPPED', 'PAYOUT', 'EVENT', 'PRESCRIPTION_UPLOADED', 'PRESCRIPTION_VERIFIED', 'ORDER_PAID']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    message: {
        type: String,
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'onModel'
    },
    onModel: {
        type: String,
        required: false,
        enum: ['Donation', 'User', 'PayoutRequest', 'Subscription', 'Event', 'Prescription', 'Order']
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
