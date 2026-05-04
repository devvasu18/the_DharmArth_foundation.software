const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    seo: {
        metaTitle: String,
        metaDescription: String
    },
    components: [{
        type: {
            type: String,
            required: true
        },
        data: mongoose.Schema.Types.Mixed,
        config: mongoose.Schema.Types.Mixed,
        order: {
            type: Number,
            default: 0
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Page', pageSchema);
