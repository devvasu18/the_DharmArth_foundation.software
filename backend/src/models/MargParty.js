const mongoose = require('mongoose');

const margPartySchema = new mongoose.Schema({
    ID: Number,
    CompanyID: Number,
    CID: { type: String, required: true }, // Party Code
    GSTNNo: String,
    Rout: String,
    Area: String,
    MR: String,
    SCode: String,
    ParNam: String,
    ParAdd1: String,
    ParAdd2: String,
    Rate: String,
    Phone1: String,
    Phone2: String,
    Phone3: String,
    Phone4: String,
    Credit: Number,
    CRDays: Number,
    CRBills: Number,
    CRStatus: String,
    MargCode: String,
    AddField: String,
    DlNo: String,
    Pin: String,
    Lat: String,
    Lng: String
}, { timestamps: true });

margPartySchema.index({ CompanyID: 1, CID: 1 }, { unique: true });

module.exports = mongoose.model('MargParty', margPartySchema);
