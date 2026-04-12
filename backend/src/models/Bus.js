const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true,
        unique: true
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusRoute',
        required: true
    },
    timing: {
        type: String, // e.g. "08:00 AM"
        required: true
    },
    capacity: Number,
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, {
    timestamps: true
});

const Bus = mongoose.model('Bus', busSchema);
module.exports = Bus;
