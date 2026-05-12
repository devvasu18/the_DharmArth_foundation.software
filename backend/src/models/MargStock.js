const mongoose = require('mongoose');

const margStockSchema = new mongoose.Schema({
    Id: Number,
    CompanyID: Number,
    PID: { type: Number, required: true },
    GCode: String,
    Batch: String,
    BatDate: Date,
    BatDet: String,
    Expiry: Date,
    SupInvo: String,
    SupDate: Date,
    SupCode: String,
    Opening: Number,
    Stock: Number,
    BrkStock: Number,
    LPRate: Number,
    Prate: Number,
    MRP: Number,
    RateA: Number,
    RateB: Number,
    RateC: Number,
    AddField: String
}, { timestamps: true });

// Stock is often per Batch and PID
margStockSchema.index({ CompanyID: 1, PID: 1, Batch: 1 }, { unique: true });

module.exports = mongoose.model('MargStock', margStockSchema);
