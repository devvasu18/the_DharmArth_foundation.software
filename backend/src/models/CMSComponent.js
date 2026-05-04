const mongoose = require('mongoose');

const cmsComponentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'slider', 
            'faq', 
            'text_block', 
            'testimonial', 
            'cta', 
            'features', 
            'gallery', 
            'video', 
            'stats'
        ]
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('CMSComponent', cmsComponentSchema);
