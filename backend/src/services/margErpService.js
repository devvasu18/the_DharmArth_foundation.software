const axios = require('axios');
const Medicine = require('../models/Medicine');
const MargProduct = require('../models/MargProduct');
const Order = require('../models/Order');

/**
 * MARG ERP Integration Service
 * Handles live stock/price checking and B2C Order Injection (InsertOrderDetailB2C)
 */
class MargErpService {
    /**
     * Check stock and price for a list of medicines from MargProduct catalog
     * @param {Array} items - [{ name: string, quantity: number, price?: number }]
     * @returns {Promise<Array>} - Verified items with prices and availability
     */
    static async checkStockAndPrice(items) {
        const verifiedItems = [];

        for (const item of items) {
            // 1. If pharmacist has already explicitly provided a price and availability
            if (item.price && !isNaN(item.price) && item.price > 0 && item.isAvailable !== undefined) {
                verifiedItems.push({
                    medicineName: item.medicineName || item.name,
                    price: Number(item.price),
                    mrp: Number(item.price) * 1.1,
                    batchNumber: item.margBatch || `BAT${Math.floor(Math.random() * 90000) + 10000}`,
                    expiryDate: item.margExpiry || '12/2027',
                    isAvailable: item.isAvailable,
                    stock: item.quantity || 1,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    time: item.time,
                    foodRelation: item.foodRelation,
                    intakeMethod: item.intakeMethod,
                    duration: item.duration,
                    quantity: item.quantity || 1,
                    margPID: item.margPID,
                    margPack: item.margPack || 1,
                    margBatch: item.margBatch || '',
                    margExpiry: item.margExpiry || '',
                    fulfillmentStatus: item.fulfillmentStatus || 'In Stock',
                    alternativeSuggested: null
                });
                continue;
            }

            const medicineNameQuery = String(item.medicineName || item.name || '').trim();
            
            // 2. Query synced MargProduct collection
            let margItem = null;
            if (item.margPID) {
                margItem = await MargProduct.findOne({
                    $or: [
                        { Code: String(item.margPID) },
                        { PID: Number(item.margPID) || 0 }
                    ],
                    Is_Deleted: { $ne: true }
                });
            }

            if (!margItem && medicineNameQuery) {
                margItem = await MargProduct.findOne({
                    Name: new RegExp(medicineNameQuery, 'i'),
                    Is_Deleted: { $ne: true }
                });
            }

            if (margItem) {
                const stockQty = margItem.Stock || 0;
                const neededQty = item.quantity || 1;
                const hasStock = stockQty >= neededQty;

                verifiedItems.push({
                    medicineName: margItem.Name,
                    price: margItem.Rate || margItem.MRP || 0,
                    mrp: margItem.MRP || margItem.Rate || 0,
                    batchNumber: margItem.Batch || 'MAIN',
                    expiryDate: margItem.Expiry || '',
                    isAvailable: hasStock,
                    stock: stockQty,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    time: item.time,
                    foodRelation: item.foodRelation,
                    intakeMethod: item.intakeMethod,
                    duration: item.duration,
                    quantity: neededQty,
                    margPID: margItem.Code,
                    margPack: margItem.Pack || 1,
                    margBatch: margItem.Batch || '',
                    margExpiry: margItem.Expiry || '',
                    fulfillmentStatus: hasStock ? 'In Stock' : 'Shortlisted',
                    alternativeSuggested: hasStock ? null : "Currently Shortlisted in Store"
                });
                continue;
            }

            // 3. Fallback to local Medicine model if not yet synced in MARG
            const localMedicine = await Medicine.findOne({ name: new RegExp(medicineNameQuery, 'i') });
            if (localMedicine) {
                const hasStock = localMedicine.stock >= (item.quantity || 1);
                verifiedItems.push({
                    medicineName: localMedicine.name,
                    price: localMedicine.price,
                    mrp: localMedicine.price * 1.1,
                    batchNumber: `MDB${Math.floor(Math.random() * 90000) + 10000}`,
                    expiryDate: '10/2026',
                    isAvailable: hasStock,
                    stock: localMedicine.stock,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    time: item.time,
                    foodRelation: item.foodRelation,
                    intakeMethod: item.intakeMethod,
                    duration: item.duration,
                    quantity: item.quantity || 1,
                    fulfillmentStatus: hasStock ? 'In Stock' : 'Shortlisted',
                    alternativeSuggested: hasStock ? null : await this.findAlternative(localMedicine.category, localMedicine._id)
                });
            } else {
                verifiedItems.push({
                    medicineName: medicineNameQuery,
                    price: item.price ? Number(item.price) : 0,
                    quantity: item.quantity || 1,
                    isAvailable: item.fulfillmentStatus === 'Shortlisted' ? false : (item.isAvailable !== undefined ? Boolean(item.isAvailable) : true),
                    alternativeSuggested: "Medicine not mapped in MARG. Admin needs to specify a manual price."
                });
            }
        }

        return verifiedItems;
    }

    static async findAlternative(category, excludeId) {
        if (!category) return "Consult pharmacist";
        const alternative = await Medicine.findOne({ 
            category, 
            _id: { $ne: excludeId },
            stock: { $gt: 0 }
        });
        return alternative ? alternative.name : "No alternative in stock";
    }

    /**
     * Push confirmed sales order to MARG ERP via InsertOrderDetailB2C
     * @param {Object} order - Populated MongoDB Order document
     * @returns {Promise<Object>} - MARG response with OrderNo
     */
    static async pushOrderToMarg(order) {
        if (!order || !order.items || order.items.length === 0) {
            console.warn('[MARG ERP] Skipping order push: No items in order');
            return null;
        }

        const companyCode = process.env.MARG_COMPANY_CODE || 'TESTCOMPANY';
        const margId = process.env.MARG_ID || '230965';
        const orderUrl = process.env.MARG_ORDER_URL || 'https://corporate.margerp.com/api/eOnlineData/InsertOrderDetailB2C';

        try {
            // Construct comma-separated ProductCodes and Quantities
            const productCodes = [];
            const quantities = [];

            for (const item of order.items) {
                // If item has a MARG Code or PID, use it, else use 0
                const code = item.margPID || item.code || '0';
                productCodes.push(code);
                quantities.push(item.quantity || 1);
            }

            const shipping = order.shippingAddress || {};
            const customerName = shipping.name || (order.user && order.user.name) || 'Valued Patient';
            const customerMobile = shipping.phone || (order.user && order.user.mobile) || '9999999999';

            const payload = {
                OrderID: String(order._id),
                OrderNo: '0',
                Partycode: process.env.MARG_DEFAULT_PARTY_CODE || '#10 ',
                CustomerID: String(order.user?.margCustomerId || '77604'),
                MargID: String(margId),
                Type: 'C',
                Sid: '0',
                ProductCode: productCodes.join(',') + ',',
                Quantity: quantities.join(',') + ',',
                Free: '0',
                Lat: '',
                Lng: '',
                Address: shipping.street || '',
                GpsID: '0',
                UserType: '1',
                Points: '0.00',
                Discounts: '0',
                Transport: '',
                Delivery: '',
                Bankname: '',
                BankAdd1: '',
                BankAdd2: '',
                shipname: customerName,
                shipAdd1: shipping.street ? shipping.street.substring(0, 35) : '',
                shipAdd2: shipping.city ? shipping.city.substring(0, 35) : '',
                shipAdd3: shipping.zip ? shipping.zip.substring(0, 35) : '',
                paymentmode: order.paymentMethod === 'PARTNER_COD' ? '2' : '1',
                paymentmodeAmount: String(order.totalAmount || 0),
                payment_remarks: order.paymentMethod || 'Online',
                order_remarks: `The Dharmarth Foundation Medicine Order #${order._id.toString().slice(-6).toUpperCase()}`,
                CustName: customerName,
                CustMobile: customerMobile,
                DoctorName: order.prescription?.doctorName || 'The Dharmarth Medical Clinic',
                DoctorMobile: '',
                CompanyCode: companyCode,
                OrderFrom: companyCode
            };

            console.log(`[MARG ERP] Pushing B2C Order #${order._id} to MARG (${orderUrl})...`);

            const response = await axios.post(orderUrl, payload, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            });

            const data = response.data;
            console.log('[MARG ERP] B2C Order Response:', data);

            if (data && (data.Status === 'Success' || data.OrderNo)) {
                const margOrderNo = String(data.OrderNo || '');
                const margCustomerId = String(data.CustmerId || data.CustomerID || '');

                await Order.findByIdAndUpdate(order._id, {
                    $set: {
                        'margOrderDetails.margOrderNo': margOrderNo,
                        'margOrderDetails.margCustomerId': margCustomerId,
                        'margOrderDetails.margStatus': 'Pushed',
                        'margOrderDetails.pushedAt': new Date(),
                        'margOrderDetails.error': null
                    }
                });

                console.log(`[MARG ERP] Order #${order._id} successfully registered in MARG ERP with OrderNo: ${margOrderNo}`);
                return data;
            } else {
                const errMsg = data?.Message || 'MARG API did not return success';
                await Order.findByIdAndUpdate(order._id, {
                    $set: {
                        'margOrderDetails.margStatus': 'Failed',
                        'margOrderDetails.error': errMsg
                    }
                });
                console.warn(`[MARG ERP] Order push warning:`, errMsg);
                return data;
            }
        } catch (error) {
            console.error('[MARG ERP] Order push error:', error.message);
            await Order.findByIdAndUpdate(order._id, {
                $set: {
                    'margOrderDetails.margStatus': 'Failed',
                    'margOrderDetails.error': error.message
                }
            });
            return null;
        }
    }

    /**
     * Trigger master catalog sync
     */
    static async syncStocks() {
        const margService = require('./marg.service');
        return await margService.sync();
    }
}

module.exports = MargErpService;
