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
        type: String // Base timing (departure from start)
    },
    mobileNumber: String,
    stopTimings: [{
        stopName: String,
        arrivalTime: String,
        arrivalDayOffset: { type: Number, default: 0 },
        departureTime: String,
        departureDayOffset: { type: Number, default: 0 }
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
