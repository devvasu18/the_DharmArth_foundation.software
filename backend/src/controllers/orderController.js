const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('prescription', 'image')
            .populate('dispatchDetails.busId')
            .sort({ createdAt: -1 });

        const Bus = require('../models/Bus');
        const ordersWithBackfill = await Promise.all(orders.map(async (order) => {
            const orderObj = order.toObject();
            if (orderObj.dispatchDetails && !orderObj.dispatchDetails.busId && orderObj.dispatchDetails.busNumber) {
                const liveBus = await Bus.findOne({ busNumber: orderObj.dispatchDetails.busNumber });
                if (liveBus) {
                    orderObj.dispatchDetails.busId = liveBus;
                    orderObj.dispatchDetails.backfill = true;
                }
            }
            return orderObj;
        }));

        res.json(ordersWithBackfill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name mobile')
            .populate('prescription', 'image')
            .populate('dispatchDetails.busId');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderObj = order.toObject();
        if (orderObj.dispatchDetails && !orderObj.dispatchDetails.busId && orderObj.dispatchDetails.busNumber) {
            const Bus = require('../models/Bus');
            const liveBus = await Bus.findOne({ busNumber: orderObj.dispatchDetails.busNumber });
            if (liveBus) {
                orderObj.dispatchDetails.busId = liveBus;
                orderObj.dispatchDetails.backfill = true;
            }
        }

        res.json(orderObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (status) {
            query.status = status;
        }

        if (search) {
            const User = require('../models/User');
            // Search users by name or mobile
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { mobile: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);

            query.$or = [
                { user: { $in: userIds } }
            ];

            // Add ID search if it looks like a hex string
            if (/^[0-9a-fA-F]{4,24}$/.test(search)) {
                // If it's a full 24-char ID, use exact match
                if (search.length === 24) {
                    query.$or.push({ _id: search });
                }
                // Partial ID search is not natively supported on ObjectId in Mongoose without aggregation
            }
        }

        const total = await Order.countDocuments(query);
        
        const orders = await Order.find(query)
            .populate('user', 'name mobile')
            .populate('dispatchDetails.busId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Logic to backfill image and FETCH DELIVERY BOY info
        const Bus = require('../models/Bus');
        const DeliveryAssignment = require('../models/DeliveryAssignment');
        
        const ordersWithBackfill = await Promise.all(orders.map(async (order) => {
            const orderObj = order.toObject();
            
            // 1. Backfill Bus info if needed
            if (orderObj.dispatchDetails && !orderObj.dispatchDetails.busId && orderObj.dispatchDetails.busNumber) {
                const liveBus = await Bus.findOne({ busNumber: orderObj.dispatchDetails.busNumber });
                if (liveBus) {
                    orderObj.dispatchDetails.busId = liveBus; 
                    orderObj.dispatchDetails.backfill = true;
                }
            }

            // 2. Fetch assigned Delivery Boy info
            const assignment = await DeliveryAssignment.findOne({ orderId: order._id })
                .populate('deliveryBoyId', 'name mobile');
            
            if (assignment && assignment.deliveryBoyId) {
                if (!orderObj.dispatchDetails) orderObj.dispatchDetails = {};
                orderObj.dispatchDetails.deliveryBoyName = assignment.deliveryBoyId.name;
                orderObj.dispatchDetails.deliveryBoyMobile = assignment.deliveryBoyId.mobile;
                orderObj.dispatchDetails.assignmentStatus = assignment.status;
            }

            return orderObj;
        }));

        res.json({
            orders: ordersWithBackfill,
            page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const { status, note } = req.body;
        order.status = status;

        // Auto-complete payment details if order moves to Processing
        if (status === 'Processing') {
            if (!order.paymentDetails) order.paymentDetails = {};
            order.paymentDetails.status = 'Completed';
            order.paymentDetails.verifiedAt = Date.now();
        }

        order.statusHistory.push({ status, note });
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download Order Invoice (PDF)
// @route   GET /api/orders/:id/invoice
// @access  Private
const downloadInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Security check: only the owner or an admin can download, 
        // UNLESS it's a public request (which we'll allow since the ID is a secure hash)
        if (req.user && order.user?._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to download this invoice' });
        }

        const invoiceService = require('../services/invoiceService');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order._id}.pdf`);

        await invoiceService.generateMedicineInvoice(order, res);
    } catch (error) {
        console.error("Invoice Generation Error:", error);
        res.status(500).json({ message: 'Failed to generate invoice' });
    }
};

// @desc    Get guest orders history
// @route   GET /api/orders/guest-history/:mobile
// @access  Public
const getGuestOrders = async (req, res) => {
    try {
        const { mobile } = req.params;
        const user = await User.findOne({ mobile });

        if (!user) {
            return res.json([]);
        }


        const orders = await Order.find({ user: user._id })
            .populate('prescription', 'image')
            .populate('dispatchDetails.busId')
            .sort({ createdAt: -1 });

        const Bus = require('../models/Bus');
        const ordersWithBackfill = await Promise.all(orders.map(async (order) => {
            const orderObj = order.toObject();
            if (orderObj.dispatchDetails && !orderObj.dispatchDetails.busId && orderObj.dispatchDetails.busNumber) {
                const liveBus = await Bus.findOne({ busNumber: orderObj.dispatchDetails.busNumber });
                if (liveBus) {
                    orderObj.dispatchDetails.busId = liveBus;
                    orderObj.dispatchDetails.backfill = true;
                }
            }
            return orderObj;
        }));

        res.json(ordersWithBackfill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all advance orders (pending shortage or restocked)
// @route   GET /api/orders/advance-orders
// @access  Private (Admin / Pharmacist)
const getAdvanceOrders = async (req, res) => {
    try {
        const orders = await Order.find({ 'advancePaymentDetails.isAdvanceOrder': true })
            .populate('user', 'name mobile')
            .populate('prescription', 'image')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get restocked advance orders queue
// @route   GET /api/orders/advance-orders/restocked
// @access  Private (Admin / Pharmacist / Packer)
const getRestockedAdvanceOrders = async (req, res) => {
    try {
        const orders = await Order.find({ 
            'advancePaymentDetails.isAdvanceOrder': true,
            status: { $in: ['Ready for Packing', 'Advance Paid', 'Processing'] }
        })
            .populate('user', 'name mobile')
            .populate('prescription', 'image')
            .sort({ updatedAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Recalculate price on restock (New MRP - Advance Paid = Balance Due)
// @route   POST /api/orders/:id/recalculate-price
// @access  Private (Admin / Pharmacist)
const recalculateRestockedPrice = async (req, res) => {
    try {
        const { revisedTotal, items } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const advancePaid = order.advancePaymentDetails?.advanceAmountPaid || 0;
        const newTotal = Number(revisedTotal) || order.totalAmount;
        const balanceDue = Math.max(0, newTotal - advancePaid);

        order.totalAmount = newTotal;
        if (order.financials) {
            order.financials.subtotal = newTotal;
        }
        order.advancePaymentDetails.revisedTotalOnArrival = newTotal;
        order.advancePaymentDetails.balanceDue = balanceDue;
        order.advancePaymentDetails.restockedAt = new Date();
        order.status = 'Ready for Packing';

        if (items && Array.isArray(items)) {
            order.items = items;
        }

        order.statusHistory.push({
            status: 'Ready for Packing',
            note: `Stock arrived. Price revised to ₹${newTotal}. Advance paid ₹${advancePaid}. Balance due ₹${balanceDue}.`
        });

        await order.save();
        res.json({ message: 'Price recalculated and moved to Ready for Packing', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get orders ready for medicine packing
// @route   GET /api/orders/packing-queue
// @access  Private (Packer / Pharmacist / Admin)
const getPackingQueue = async (req, res) => {
    try {
        const orders = await Order.find({ 
            status: { $in: ['Ready for Packing', 'Advance Paid', 'Processing'] }
        })
            .populate('user', 'name mobile')
            .populate('prescription', 'image')
            .sort({ createdAt: 1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark order as packed with verification details
// @route   POST /api/orders/:id/pack
// @access  Private (Packer / Pharmacist / Admin)
const markOrderPacked = async (req, res) => {
    try {
        const { tamperSealVerified, packerNotes } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = 'Ready for Dispatch';
        order.statusHistory.push({
            status: 'Ready for Dispatch',
            note: `Packed and sealed securely by ${req.user?.name || 'Packer'}. Seal Verified: ${tamperSealVerified ? 'Yes' : 'No'}. ${packerNotes || ''}`,
            updatedAt: new Date()
        });

        await order.save();
        res.json({ message: 'Order successfully verified, packed, and queued for dispatch', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    1-Click Advance Order Refund (SLA Exceeded)
// @route   POST /api/orders/:id/refund-advance
// @access  Private (Admin / Pharmacist)
const refundAdvanceOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const advanceAmount = order.advancePaymentDetails?.advanceAmountPaid || 0;
        if (advanceAmount > 0 && order.user) {
            order.user.walletBalance = (order.user.walletBalance || 0) + advanceAmount;
            await order.user.save();
        }

        order.status = 'Cancelled';
        if (order.advancePaymentDetails) {
            order.advancePaymentDetails.refundStatus = 'Processed';
        }
        if (order.paymentDetails) {
            order.paymentDetails.status = 'Refunded';
        }

        order.statusHistory.push({
            status: 'Cancelled',
            note: `Advance token ₹${advanceAmount} refunded to user wallet due to procurement SLA timeframe limit.`,
            updatedAt: new Date()
        });

        await order.save();
        res.json({ message: `Advance amount ₹${advanceAmount} refunded to patient wallet successfully`, order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    downloadInvoice,
    getGuestOrders,
    getAdvanceOrders,
    getRestockedAdvanceOrders,
    recalculateRestockedPrice,
    getPackingQueue,
    markOrderPacked,
    refundAdvanceOrder
};
