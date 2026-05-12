const mongoose = require('mongoose');

const margProductSchema = new mongoose.Schema({
    ID: { type: Number, required: true },
    CompanyID: { type: Number, required: true },
    PID: { type: Number, required: true }, // PID from MARG
    Code: String,
    Name: { type: String, required: true },
    Unit: String,
    Pack: Number,
    GCode: String,
    GCode3: String,
    GCode5: String,
    GCode6: String,
    GST: Number,
    MargCode: String,
    AddField: String
}, { timestamps: true });

// Prevent duplicates using CompanyID and PID
margProductSchema.index({ CompanyID: 1, PID: 1 }, { unique: true });

module.exports = mongoose.model('MargProduct', margProductSchema);
