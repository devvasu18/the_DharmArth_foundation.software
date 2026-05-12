const mongoose = require('mongoose');

const margMasterSchema = new mongoose.Schema({
    ID: Number,
    CompanyID: { type: Number, required: true, unique: true },
    Code: String,
    Name: String,
    MargKey: String,
    StoreID: String,
    Licence: String,
    Branch: String
}, { timestamps: true });

module.exports = mongoose.model('MargMaster', margMasterSchema);
