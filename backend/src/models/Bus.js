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
        type: String, // Base timing (departure from start)
        required: true
    },
    mobileNumber: String,
    stopTimings: [{
        stopName: String,
        arrivalTime: String,
        departureTime: String
    }],
    image: String,
    comment: String,
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
