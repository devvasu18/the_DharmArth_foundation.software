const MargProduct = require('../models/MargProduct');
const MargParty = require('../models/MargParty');
const MargStock = require('../models/MargStock');
const MargDetail = require('../models/MargDetail');
const margService = require('../services/marg.service');

exports.getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const query = search ? { Name: new RegExp(search, 'i') } : {};
        
        const products = await MargProduct.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ Name: 1 });

        const count = await MargProduct.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalRecords: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getParties = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const query = search ? { ParNam: new RegExp(search, 'i') } : {};

        const parties = await MargParty.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ ParNam: 1 });

        const count = await MargParty.countDocuments(query);

        res.json({
            parties,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalRecords: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStocks = async (req, res) => {
    try {
        const { page = 1, limit = 20, pid } = req.query;
        const query = pid ? { PID: Number(pid) } : {};

        const stocks = await MargStock.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ updatedAt: -1 });

        const count = await MargStock.countDocuments(query);

        res.json({
            stocks,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 20, voucher } = req.query;
        const query = voucher ? { Voucher: voucher } : {};

        const invoices = await MargDetail.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ Date: -1 });

        const count = await MargDetail.countDocuments(query);

        res.json({
            invoices,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.searchProductsWithStock = async (req, res) => {
    try {
        const { search = '' } = req.query;
        if (!search || search.trim().length < 2) {
            return res.json({ products: [] });
        }

        const queryStr = search.trim();
        const regex = new RegExp(queryStr, 'i');

        const products = await MargProduct.find({
            $and: [
                { Is_Deleted: { $ne: true } },
                {
                    $or: [
                        { Name: regex },
                        { Code: regex },
                        { Salt: regex },
                        { Company: regex }
                    ]
                }
            ]
        })
        .limit(25)
        .sort({ Name: 1 })
        .lean();

        const formatted = products.map(p => ({
            _id: p._id,
            PID: p.Code || String(p.PID || ''),
            Code: p.Code,
            Name: p.Name,
            Company: p.Company || '',
            Salt: p.Salt || '',
            Unit: p.Unit || 'PCS',
            Pack: p.Pack || 1,
            totalStock: p.Stock || 0,
            mrp: p.MRP || 0,
            rateA: p.Rate || 0,
            stocks: [
                {
                    Batch: p.Batch || 'MAIN',
                    Expiry: p.Expiry || '',
                    MRP: p.MRP || 0,
                    RateA: p.Rate || 0,
                    Stock: p.Stock || 0
                }
            ]
        }));

        res.json({ products: formatted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkStockBulk = async (req, res) => {
    try {
        const { pids = [] } = req.body;
        if (!pids.length) return res.json({ availability: {} });

        const stringPids = pids.map(String);
        const numberPids = pids.map(Number).filter(n => !isNaN(n));

        const products = await MargProduct.find({
            $or: [
                { Code: { $in: stringPids } },
                { PID: { $in: numberPids } }
            ]
        }).lean();

        const availabilityMap = {};
        pids.forEach(p => {
            const found = products.find(prod => prod.Code === String(p) || prod.PID === Number(p));
            availabilityMap[p] = found ? (found.Stock > 0) : false;
        });

        res.json({ availability: availabilityMap });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.triggerSync = async (req, res) => {
    try {
        // Run sync in background
        margService.sync().catch(err => console.error('Manual Sync Failed:', err));
        res.json({ message: 'Sync process started in background.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.syncDispatch = async (req, res) => {
    try {
        const result = await margService.syncDispatchStatus();
        res.json({ message: 'Dispatch status sync completed.', data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
