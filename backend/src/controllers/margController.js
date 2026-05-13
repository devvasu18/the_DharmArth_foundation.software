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
        if (!search || search.length < 2) {
            return res.json({ products: [] });
        }

        const products = await MargProduct.aggregate([
            {
                $match: {
                    Name: new RegExp(search, 'i')
                }
            },
            {
                $lookup: {
                    from: 'margstocks', // collection name for MargStock
                    let: { pid: '$PID', cid: '$CompanyID' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$PID', '$$pid'] },
                                        { $eq: ['$CompanyID', '$$cid'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'stocks'
                }
            },
            {
                $project: {
                    Name: 1,
                    PID: 1,
                    Code: 1,
                    Unit: 1,
                    Pack: 1,
                    totalStock: { $sum: '$stocks.Stock' },
                    mrp: { $max: '$stocks.MRP' },
                    rateA: { $max: '$stocks.RateA' }
                }
            },
            { $limit: 10 },
            { $sort: { Name: 1 } }
        ]);

        res.json({ products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkStockBulk = async (req, res) => {
    try {
        const { pids = [] } = req.body;
        if (!pids.length) return res.json({ available: {} });

        const stocks = await MargStock.aggregate([
            {
                $match: {
                    PID: { $in: pids.map(Number) }
                }
            },
            {
                $group: {
                    _id: '$PID',
                    totalStock: { $sum: '$Stock' }
                }
            }
        ]);

        const availabilityMap = {};
        stocks.forEach(s => {
            availabilityMap[s._id] = s.totalStock > 0;
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
