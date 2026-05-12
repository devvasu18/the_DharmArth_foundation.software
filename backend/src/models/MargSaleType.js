const mongoose = require('mongoose');

const margSaleTypeSchema = new mongoose.Schema({
    ID: Number,
    CompanyID: Number,
    SGCode: String,
    SCode: Number,
    Name: String,
    Main: String,
    MargCode: String,
    AddField: String
}, { timestamps: true });

margSaleTypeSchema.index({ CompanyID: 1, ID: 1 }, { unique: true });

module.exports = mongoose.model('MargSaleType', margSaleTypeSchema);
