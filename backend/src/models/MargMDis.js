const mongoose = require('mongoose');

const margMDisSchema = new mongoose.Schema({
    ID: Number,
    Companyid: Number,
    CompanyID: Number,
    Voucher: { type: String, required: true },
    Type: String,
    VCN: String,
    Date: Date,
    CID: String,
    Final: Number,
    Cash: Number,
    Others: Number,
    Salun: String,
    MR: String,
    Rout: String,
    Area: String,
    ORN: String,
    AddField: String,
    ODate: Date
}, { timestamps: true });

margMDisSchema.index({ Voucher: 1 }, { unique: true }); // Voucher is globally unique in most cases or add Companyid

module.exports = mongoose.model('MargMDis', margMDisSchema);
