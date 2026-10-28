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
    recipientDetails: {
        type: { type: String, enum: ['Self', 'Other'], default: 'Self' },
        patientName: String,
        patientPhone: String,
        relation: String
    },
    courseDays: {
        type: Number,
        default: 15
    },
    advancePaymentDetails: {
        isAdvanceOrder: { type: Boolean, default: false },
        tokenPercentage: { type: Number, default: 50 },
        advanceAmountPaid: { type: Number, default: 0 },
        originalEstimatedTotal: Number,
        revisedTotalOnArrival: Number,
        balanceDue: { type: Number, default: 0 },
        restockedAt: Date,
        refundStatus: { type: String, enum: ['None', 'Eligible', 'Processed'], default: 'None' }
    },
    doctorConsultation: {
        required: { type: Boolean, default: false },
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Not Required', 'Pending', 'Approved', 'Rejected'], default: 'Not Required' },
        decisionNotes: String,
        consultedAt: Date
    },
    status: {
        type: String,
        enum: ['Awaiting Approval', 'Payment Pending', 'Doctor Consultation Pending', 'Advance Paid', 'Processing', 'Ready for Packing', 'Ready for Dispatch', 'In Transit', 'Arrived at Partner Shop', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Payment Pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        phone: String,
        altPhone: String,
        villageName: String,
        stoppageName: String
    },
    partnerShop: {
        partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        shopName: String,
        location: String,
        receivedFromBusAt: Date,
        pickupOtp: String,
        codCollected: { type: Boolean, default: false },
        codAmount: { type: Number, default: 0 }
    },
    paymentDetails: {
        method: { type: String, enum: ['COD', 'Online', 'Wallet', 'PARTNER_COD'], default: 'Online' },
        transactionId: String,
        status: { type: String, enum: ['Pending', 'Partially Paid', 'Completed', 'Failed', 'Refunded'], default: 'Pending' }
    },
    orderType: {
        type: String,
        enum: ['Medicine', 'Donation', 'Event'],
        default: 'Medicine'
    },
    orderSource: {
        type: String,
        enum: ['Website', 'Created by Medical/Admin', 'Phone Call Intake'],
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
    },
    margOrderDetails: {
        margOrderNo: String,
        margCustomerId: String,
        margStatus: String,
        billNo: String,
        billDate: Date,
        billAmount: Number,
        pushedAt: Date,
        lastSyncedAt: Date,
        error: String
    }
}, {
    timestamps: true
});

// Indexes for performance
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ prescription: 1 });
orderSchema.index({ 'margOrderDetails.margOrderNo': 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
