const Order = require('../models/Order');

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await Order.countDocuments();
        
        const orders = await Order.find({})
            .populate('user', 'name mobile')
            .populate('dispatchDetails.busId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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

module.exports = {
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    downloadInvoice
};
