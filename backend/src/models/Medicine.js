const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    brand: String,
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    description: String,
    category: String, // e.g. Syrup, Tablet, Capsule
    isPrescriptionRequired: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

medicineSchema.index({ category: 1 });

const Medicine = mongoose.model('Medicine', medicineSchema);
module.exports = Medicine;
