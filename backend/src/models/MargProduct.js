const mongoose = require('mongoose');

const margProductSchema = new mongoose.Schema({
    CompanyID: { type: Number, default: 0 },
    PID: { type: Number, index: true }, // Row ID (rid) or legacy PID
    Code: { type: String, required: true, index: true }, // Item Code in MARG (e.g. "1000002")
    Name: { type: String, required: true, index: true }, // Item Name (BETNESOL INJ.)
    Company: String, // Manufacturer (CADILA PHARMA)
    Stock: { type: Number, default: 0 }, // Current stock quantity
    MRP: { type: Number, default: 0 }, // Maximum Retail Price
    Rate: { type: Number, default: 0 }, // Billing Rate / Selling Price
    PRate: { type: Number, default: 0 }, // Purchase Rate
    Batch: String, // Running Batch (CurBatch)
    Expiry: String, // Expiry Date string (Exp)
    Pack: { type: Number, default: 1 }, // Conversion / Units per pack
    Unit: String,
    Salt: String, // Generic / Salt composition
    CatCode: String,
    GCode: String,
    GCode6: String,
    ProductCode: String,
    MargCode: String,
    Is_Deleted: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index for fast code lookup and text searching
margProductSchema.index({ Code: 1, CompanyID: 1 });
margProductSchema.index({ Name: 'text', Salt: 'text', Company: 'text' });

module.exports = mongoose.model('MargProduct', margProductSchema);
