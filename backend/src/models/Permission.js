const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    moduleName: {
        type: String,
        required: true,
        unique: true
    },
    availableActions: [{
        type: String // e.g. 'view', 'create', 'edit', 'delete'
    }]
}, {
    timestamps: true,
});

const Permission = mongoose.model('Permission', permissionSchema);
module.exports = Permission;
