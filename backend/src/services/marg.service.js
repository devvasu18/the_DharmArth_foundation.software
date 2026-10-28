const axios = require('axios');
const MargSyncStatus = require('../models/MargSyncStatus');
const MargProduct = require('../models/MargProduct');
const MargParty = require('../models/MargParty');
const MargDecryption = require('../utils/margDecryption');

class MargService {
    constructor() {
        this.companyCode = process.env.MARG_COMPANY_CODE || 'TESTCOMPANY';
        this.margId = process.env.MARG_ID || '230965';
        this.decryptionKey = process.env.MARG_DECRYPTION_KEY || 'CJ4IJ1O85Q7Y';
        this.masterUrl = process.env.MARG_MASTER_URL || 'https://corporate.margerp.com/api/eOnlineData/MargMST2017';
        this.orderUrl = process.env.MARG_ORDER_URL || 'https://corporate.margerp.com/api/eOnlineData/InsertOrderDetailB2C';
        this.dispatchUrl = process.env.MARG_DISPATCH_URL || 'https://corporate.margerp.com/api/eOnlineData/LiveOrderDispatchStatus2017';
    }

    /**
     * Main Master Catalog Sync Orchestrator (Products, Stock, Companies, Parties)
     * Calls MargMST2017 with CompanyCode, MargID, Datetime, index
     */
    async sync() {
        let status = await MargSyncStatus.findOne();
        if (!status) {
            status = await MargSyncStatus.create({ syncStatus: 'Idle' });
        }

        if (status.syncStatus === 'In Progress') {
            console.log('[MARG] Sync already in progress, skipping...');
            return { message: 'Sync already in progress' };
        }

        try {
            status.syncStatus = 'In Progress';
            status.lastError = null;
            await status.save();

            console.log(`[MARG] Starting sync process with MARG ID: ${this.margId}, Company: ${this.companyCode}...`);

            const payload = {
                CompanyCode: this.companyCode,
                MargID: String(this.margId),
                Datetime: status.lastSyncDatetime ? this.formatDate(status.lastSyncDatetime) : '',
                index: String(status.lastIndex || 0)
            };

            const response = await axios.post(this.masterUrl, payload, {
                timeout: 60000,
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.data) {
                throw new Error('Empty response received from MARG Master API');
            }

            // Decrypt response using AES-128-CBC + Raw Deflate
            const decrypted = MargDecryption.decrypt(response.data, this.decryptionKey);
            if (!decrypted) {
                throw new Error('Failed to decrypt MARG Master response. Check decryption key and network payload.');
            }

            const details = decrypted.Details || decrypted;
            const results = await this.processMasterData(details);

            // Update sync record
            status.lastSyncDatetime = new Date();
            if (details.Index !== undefined && details.Index !== null) {
                status.lastIndex = Number(details.Index);
            }
            status.totalRecords = (status.totalRecords || 0) + results.total;
            status.syncStatus = 'Completed';
            status.lastSyncedAt = new Date();
            await status.save();

            console.log(`[MARG] Sync completed successfully. Processed ${results.total} records.`);
            return { success: true, ...results };
        } catch (error) {
            console.error('[MARG] Sync Error:', error.message);
            status.syncStatus = 'Failed';
            status.lastError = error.message;
            await status.save();
            throw error;
        }
    }

    /**
     * Ingests parsed catalog data: pro_N, pro_U, pro_S, pro_R, Party
     */
    async processMasterData(details) {
        let total = 0;

        // 1. Process New Products (pro_N)
        if (Array.isArray(details.pro_N) && details.pro_N.length > 0) {
            console.log(`[MARG] Ingesting ${details.pro_N.length} new products (pro_N)...`);
            await this.upsertProducts(details.pro_N);
            total += details.pro_N.length;
        }

        // 2. Process Updated Products (pro_U)
        if (Array.isArray(details.pro_U) && details.pro_U.length > 0) {
            console.log(`[MARG] Updating ${details.pro_U.length} products (pro_U)...`);
            await this.upsertProducts(details.pro_U);
            total += details.pro_U.length;
        }

        // 3. Process Stock Updates (pro_S)
        if (Array.isArray(details.pro_S) && details.pro_S.length > 0) {
            console.log(`[MARG] Updating stock for ${details.pro_S.length} products (pro_S)...`);
            await this.updateStockOnly(details.pro_S);
            total += details.pro_S.length;
        }

        // 4. Process Rate / Price Updates (pro_R)
        if (Array.isArray(details.pro_R) && details.pro_R.length > 0) {
            console.log(`[MARG] Updating rates for ${details.pro_R.length} products (pro_R)...`);
            await this.updateRateOnly(details.pro_R);
            total += details.pro_R.length;
        }

        // 5. Process Parties / Customers (Party)
        if (Array.isArray(details.Party) && details.Party.length > 0) {
            console.log(`[MARG] Ingesting ${details.Party.length} parties...`);
            await this.upsertParties(details.Party);
            total += details.Party.length;
        }

        return { total };
    }

    async upsertProducts(productList) {
        const ops = productList.map(p => {
            const itemCode = String(p.code || p.Code || p.ProductCode || '').trim();
            const itemName = String(p.name || p.Name || '').trim();
            if (!itemCode || !itemName) return null;

            return {
                updateOne: {
                    filter: { Code: itemCode },
                    update: {
                        $set: {
                            Code: itemCode,
                            Name: itemName,
                            PID: Number(p.rid || p.PID || 0),
                            Company: String(p.company || p.Company || '').trim(),
                            Stock: Number(p.stock || p.Stock || 0),
                            MRP: Number(p.MRP || 0),
                            Rate: Number(p.Rate || 0),
                            PRate: Number(p.PRate || 0),
                            Batch: String(p.curbatch || p.CurBatch || '').trim(),
                            Expiry: String(p.exp || p.Exp || '').trim(),
                            Pack: Number(p.Conversion || p.Pack || 1),
                            Salt: String(p.Salt || '').trim(),
                            CatCode: String(p.catcode || p.CatCode || '').trim(),
                            GCode: String(p.gcode || p.GCode || '').trim(),
                            Is_Deleted: p.Is_Deleted === '1' || p.Is_Deleted === 1,
                            CompanyID: Number(this.margId || 0)
                        }
                    },
                    upsert: true
                }
            };
        }).filter(Boolean);

        if (ops.length > 0) {
            await MargProduct.bulkWrite(ops, { ordered: false });
        }
    }

    async updateStockOnly(stockList) {
        const ops = stockList.map(s => {
            const code = String(s.Code || s.code || '').trim();
            if (!code) return null;
            return {
                updateOne: {
                    filter: { Code: code },
                    update: {
                        $set: { Stock: Number(s.Stock || s.stock || 0) }
                    }
                }
            };
        }).filter(Boolean);

        if (ops.length > 0) {
            await MargProduct.bulkWrite(ops, { ordered: false });
        }
    }

    async updateRateOnly(rateList) {
        const ops = rateList.map(r => {
            const code = String(r.Code || r.code || '').trim();
            if (!code) return null;
            return {
                updateOne: {
                    filter: { Code: code },
                    update: {
                        $set: {
                            MRP: Number(r.MRP || 0),
                            Rate: Number(r.Rate || 0),
                            PRate: Number(r.PRate || 0)
                        }
                    }
                }
            };
        }).filter(Boolean);

        if (ops.length > 0) {
            await MargProduct.bulkWrite(ops, { ordered: false });
        }
    }

    async upsertParties(partyList) {
        const ops = partyList.map(party => {
            const code = String(party.Code || party.CID || '').trim();
            if (!code) return null;
            return {
                updateOne: {
                    filter: { CID: code },
                    update: {
                        $set: {
                            CID: code,
                            ParNam: String(party.Name || party.ParNam || '').trim(),
                            Area: String(party.Area || '').trim(),
                            Phone1: String(party.Phone1 || '').trim(),
                            Credit: Number(party.Balance || 0),
                            CompanyID: Number(this.margId || 0)
                        }
                    },
                    upsert: true
                }
            };
        }).filter(Boolean);

        if (ops.length > 0) {
            await MargParty.bulkWrite(ops, { ordered: false });
        }
    }

    /**
     * Poll MARG for sales order bill generation & dispatch status
     */
    async syncDispatchStatus(salesmanId = '001') {
        try {
            const payload = {
                CompanyCode: this.companyCode,
                MargID: String(this.margId),
                SalesmanID: String(salesmanId),
                Type: 'S',
                Datetime: '',
                index: '0'
            };

            const response = await axios.post(this.dispatchUrl, payload, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.data) return null;
            const decrypted = MargDecryption.decrypt(response.data, this.decryptionKey);
            if (!decrypted) return null;

            const Order = require('../models/Order');
            const orderMains = decrypted['Order Main'] || decrypted.OrderMain || [];

            for (const item of orderMains) {
                if (!item['OrderNo.'] && !item.OrderNo) continue;
                const orderNo = String(item['OrderNo.'] || item.OrderNo).trim();

                const updateFields = {
                    'margOrderDetails.lastSyncedAt': new Date()
                };

                if (item.Vcn) updateFields['margOrderDetails.billNo'] = item.Vcn;
                if (item.Dt) updateFields['margOrderDetails.billDate'] = new Date(item.Dt);
                if (item.Amount) updateFields['margOrderDetails.billAmount'] = Number(item.Amount);

                await Order.updateMany(
                    { 'margOrderDetails.margOrderNo': orderNo },
                    { $set: updateFields }
                );
            }

            return decrypted;
        } catch (err) {
            console.error('[MARG] Dispatch status sync failed:', err.message);
            return null;
        }
    }

    formatDate(date) {
        // MARG expects YYYY-MM-DD HH:mm:ss
        return date.toISOString().replace('T', ' ').substring(0, 19);
    }
}

module.exports = new MargService();
