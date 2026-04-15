const Order = require('../models/Order');

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
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
        const orders = await Order.find({})
            .populate('user', 'name mobile')
            .populate('dispatchDetails.busId')
            .sort({ createdAt: -1 });

        // Logic to backfill image if missing in snapshot but exists in master Bus record
        const Bus = require('../models/Bus');
        const ordersWithBackfill = await Promise.all(orders.map(async (order) => {
            const orderObj = order.toObject();
            if (orderObj.dispatchDetails && !orderObj.dispatchDetails.busId && orderObj.dispatchDetails.busNumber) {
                const liveBus = await Bus.findOne({ busNumber: orderObj.dispatchDetails.busNumber });
                if (liveBus) {
                    orderObj.dispatchDetails.busId = liveBus; // Backfill the bus object
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

module.exports = {
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus
};
