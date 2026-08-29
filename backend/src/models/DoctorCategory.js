const mongoose = require('mongoose');

const doctorCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    icon: {
        type: String,
        default: '' // Can store emoji or lucide icon name
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('DoctorCategory', doctorCategorySchema);
