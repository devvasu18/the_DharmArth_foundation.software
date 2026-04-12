const mongoose = require('mongoose');

const deliveryAssignmentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusRoute'
    },
    status: {
        type: String,
        enum: ['Assigned', 'In Transit', 'Delivered', 'Failed'],
        default: 'Assigned'
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: Date,
    notes: String
}, {
    timestamps: true
});

// Indexes for performance
deliveryAssignmentSchema.index({ orderId: 1 });
deliveryAssignmentSchema.index({ deliveryBoyId: 1 });
deliveryAssignmentSchema.index({ status: 1 });
deliveryAssignmentSchema.index({ createdAt: -1 });

const DeliveryAssignment = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);
module.exports = DeliveryAssignment;
