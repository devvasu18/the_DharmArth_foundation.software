const axios = require('axios');
const MargSyncStatus = require('../models/MargSyncStatus');
const MargProduct = require('../models/MargProduct');
const MargParty = require('../models/MargParty');
const MargStock = require('../models/MargStock');
const MargDetail = require('../models/MargDetail');
const MargMaster = require('../models/MargMaster');
const MargMDis = require('../models/MargMDis');
const MargSaleType = require('../models/MargSaleType');
const MargDecryption = require('../utils/margDecryption');

class MargService {
    constructor() {
        this.companyCode = process.env.MARG_COMPANY_CODE;
        this.margKey = process.env.MARG_KEY;
        this.decryptionKey = process.env.MARG_DECRYPTION_KEY;
        this.edeUrl = process.env.MARG_EDE_POST_URL;
        this.mastersUrl = process.env.MARG_MASTERS_GET_URL;
    }

    /**
     * Main Sync Orchestrator
     */
    async sync() {
        let status = await MargSyncStatus.findOne();
        if (!status) {
            status = await MargSyncStatus.create({ syncStatus: 'Idle' });
        }

        if (status.syncStatus === 'In Progress') {
            console.log('[MARG] Sync already in progress, skipping...');
            return;
        }

        try {
            status.syncStatus = 'In Progress';
            status.lastError = null;
            await status.save();

            console.log('[MARG] Starting sync process...');
            
            // 1. Fetch data from MARG
            const payload = {
                CompanyCode: this.companyCode,
                Datetime: status.lastSyncDatetime ? this.formatDate(status.lastSyncDatetime) : "",
                MargKey: this.margKey,
                Index: status.lastIndex || 0,
                CompanyID: "0", // Pass 0 for all branches
                APIType: "2"
            };

            const response = await axios.post(this.edeUrl, payload, { timeout: 60000 });
            
            if (!response.data || response.data.Status === "Failure") {
                throw new Error(response.data.Message || 'API returned failure status');
            }

            // 2. Decrypt response
            // The API returns an object where some fields might be encrypted or the whole data
            // Based on requirement 8: "Accept encrypted response, use provided DLL/decryption key"
            // Usually, the response body itself or a specific field is encrypted.
            // If the response is a string, it's the whole thing. If it's an object with "Data", it's likely "Data".
            let decryptedData = response.data;
            if (typeof response.data === 'string') {
                decryptedData = MargDecryption.decrypt(response.data, this.decryptionKey);
            } else if (response.data.Data && typeof response.data.Data === 'string') {
                decryptedData = MargDecryption.decrypt(response.data.Data, this.decryptionKey);
            }

            if (!decryptedData) {
                throw new Error('Decryption failed or returned empty data');
            }

            // 3. Process and Save records
            const results = await this.processData(decryptedData);

            // 4. Update status
            status.lastSyncDatetime = new Date();
            // MARG API typically returns a new Index in the response to continue from
            status.lastIndex = decryptedData.Index || results.maxIndex || status.lastIndex;
            status.totalRecords += results.total;
            status.syncStatus = 'Completed';
            status.lastSyncedAt = new Date();
            await status.save();

            console.log(`[MARG] Sync completed successfully. Processed ${results.total} records.`);
        } catch (error) {
            console.error('[MARG] Sync Error:', error.message);
            status.syncStatus = 'Failed';
            status.lastError = error.message;
            await status.save();
            throw error;
        }
    }

    async processData(data) {
        const collections = {
            'Details': { model: MargDetail, key: 'Details' },
            'Masters': { model: MargMaster, key: 'Masters' },
            'MDis': { model: MargMDis, key: 'MDis' },
            'Party': { model: MargParty, key: 'Party' },
            'Product': { model: MargProduct, key: 'Product' },
            'SaleType': { model: MargSaleType, key: 'SaleType' },
            'Stock': { model: MargStock, key: 'Stock' }
        };

        let totalProcessed = 0;
        let maxIndex = 0;

        for (const [key, config] of Object.entries(collections)) {
            const records = data[config.key] || data[key];
            if (records && Array.isArray(records) && records.length > 0) {
                console.log(`[MARG] Processing ${records.length} records for ${key}`);
                await this.bulkSave(config.model, records);
                totalProcessed += records.length;
                
                // Track max index if available in records
                const indices = records.map(r => r.Index || 0).filter(i => i > 0);
                if (indices.length > 0) {
                    maxIndex = Math.max(maxIndex, ...indices);
                }
            }
        }

        return { total: totalProcessed, maxIndex };
    }

    async bulkSave(model, records) {
        if (!records.length) return;

        const ops = records.map(record => {
            // Define unique filter based on model
            let filter = {};
            if (model.modelName === 'MargProduct') filter = { CompanyID: record.CompanyID, PID: record.PID };
            else if (model.modelName === 'MargParty') filter = { CompanyID: record.CompanyID, CID: record.CID };
            else if (model.modelName === 'MargStock') filter = { CompanyID: record.CompanyID, PID: record.PID, Batch: record.Batch };
            else if (model.modelName === 'MargDetail') filter = { CompanyID: record.CompanyID, Voucher: record.Voucher, PID: record.PID, Batch: record.Batch };
            else if (model.modelName === 'MargMaster') filter = { CompanyID: record.CompanyID };
            else if (model.modelName === 'MargMDis') filter = { Voucher: record.Voucher || record.VCN };
            else if (model.modelName === 'MargSaleType') filter = { CompanyID: record.CompanyID, ID: record.ID };
            else filter = { ID: record.ID };

            return {
                updateOne: {
                    filter,
                    update: { $set: record },
                    upsert: true
                }
            };
        });

        await model.bulkWrite(ops);
    }

    formatDate(date) {
        // MARG expects YYYY-MM-DD HH:mm:ss
        return date.toISOString().replace('T', ' ').substring(0, 19);
    }
}

module.exports = new MargService();
