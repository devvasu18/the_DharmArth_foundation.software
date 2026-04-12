const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: true,
        unique: true
    },
    stops: [{
        type: String,
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const BusRoute = mongoose.model('BusRoute', busRouteSchema);
module.exports = BusRoute;
