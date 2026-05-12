const mongoose = require('mongoose');

const margDetailSchema = new mongoose.Schema({
    Dis: Number,
    CompanyID: Number,
    Voucher: { type: String, required: true },
    Type: String,
    Vcn: String,
    Date: Date,
    CID: String,
    PID: String,
    Gcode: String,
    Batch: String,
    BatDet: String,
    Qty: Number,
    Free: Number,
    MRP: Number,
    Rate: Number,
    Discount: Number,
    Amount: Number,
    GST: Number,
    GSTamount: Number,
    AddFields: String
}, { timestamps: true });

// Prevent duplicates using Voucher, CompanyID, and PID/Batch
margDetailSchema.index({ CompanyID: 1, Voucher: 1, PID: 1, Batch: 1 }, { unique: true });

module.exports = mongoose.model('MargDetail', margDetailSchema);
