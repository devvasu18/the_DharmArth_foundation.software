const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    permissions: [{
        module: { type: String, required: true },
        actions: [{ type: String }] // e.g. ['view', 'create', 'edit', 'delete']
    }],
    // User who assigned/created this role
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
});

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;
