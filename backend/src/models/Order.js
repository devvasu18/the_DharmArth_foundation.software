const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },
    items: [{
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        name: String,
        quantity: Number,
        price: Number,
        dosage: String,
        frequency: String,
        time: String,
        foodRelation: String,
        intakeMethod: String,
        fulfillmentStatus: { 
            type: String, 
            enum: ['Packed', 'Shortlisted', 'Received'], 
            default: 'Packed' 
        },
        margPack: Number,
        margBatch: String,
        margExpiry: String,
        margBillNo: String
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    financials: {
        subtotal: Number,
        gst: Number,
        platformFee: Number,
        deliveryCharge: Number
    },
    status: {
        type: String,
        enum: ['Awaiting Approval', 'Payment Pending', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Payment Pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        phone: String,
        altPhone: String
    },
    paymentDetails: {
        method: { type: String, enum: ['COD', 'Online', 'Wallet'], default: 'Online' },
        transactionId: String,
        status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' }
    },
    orderType: {
        type: String,
        enum: ['Medicine', 'Donation', 'Event'],
        default: 'Medicine'
    },
    orderSource: {
        type: String,
        enum: ['Website', 'Created by Medical/Admin'],
        default: 'Website'
    },
    statusHistory: [{
        status: String,
        updatedAt: { type: Date, default: Date.now },
        note: String
    }],
    dispatchDetails: {
        busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
        busNumber: String,
        busName: String,
        vehicleName: String,
        conductorNumber: String,
        routeName: String,
        busImage: String,
        pickupStoppage: String,
        estimatedArrivalTime: String,
        dispatchedAt: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ prescription: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
