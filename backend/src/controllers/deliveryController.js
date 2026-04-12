const BusRoute = require('../models/BusRoute');
const Bus = require('../models/Bus');
const DeliveryAssignment = require('../models/DeliveryAssignment');
const Order = require('../models/Order');

// --- Bus Route Management (Admin) ---

exports.createRoute = async (req, res) => {
    try {
        const route = await BusRoute.create(req.body);
        res.status(201).json(route);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRoutes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await BusRoute.countDocuments();
        const routes = await BusRoute.find().skip(skip).limit(limit);

        res.json({
            routes,
            page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createBus = async (req, res) => {
    try {
        const bus = await Bus.create(req.body);
        res.status(201).json(bus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBusesByRoute = async (req, res) => {
    try {
        const buses = await Bus.find({ routeId: req.params.routeId });
        res.json(buses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Delivery Assignment (Admin) ---

exports.assignDelivery = async (req, res) => {
    const { orderId, deliveryBoyId, busId, routeId, notes } = req.body;
    try {
        // 1. Check if Order exists and is paid (or COD)
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isPaid = order.paymentDetails && order.paymentDetails.status === 'Completed';
        const isCOD = order.paymentDetails && order.paymentDetails.method === 'COD';

        if (!isPaid && !isCOD) {
            return res.status(400).json({ message: 'Cannot assign delivery for unpaid online orders' });
        }

        // 2. Check if already assigned to an active delivery
        const existingAssignment = await DeliveryAssignment.findOne({ 
            orderId, 
            status: { $in: ['Assigned', 'In Transit'] } 
        });
        if (existingAssignment) {
            return res.status(400).json({ message: 'Order is already assigned to an active delivery' });
        }

        const assignment = await DeliveryAssignment.create({
            orderId,
            deliveryBoyId,
            busId,
            routeId,
            notes
        });

        // Update Order status
        await Order.findByIdAndUpdate(orderId, { 
            status: 'Out for Delivery',
            $push: { statusHistory: { status: 'Out for Delivery', note: 'Assigned to delivery' } }
        });

        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Delivery Boy Dashboard ---

exports.getAssignedOrders = async (req, res) => {
    try {
        const assignments = await DeliveryAssignment.find({ 
            deliveryBoyId: req.user._id,
            status: { $ne: 'Delivered' }
        })
        .populate({
            path: 'orderId',
            populate: { path: 'user', select: 'name mobile' }
        })
        .populate('busId')
        .populate('routeId');

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateAssignmentStatus = async (req, res) => {
    const { status, notes } = req.body;
    try {
        const assignment = await DeliveryAssignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

        // SECURITY: Verify ownership
        if (assignment.deliveryBoyId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this assignment' });
        }

        assignment.status = status;
        if (notes) assignment.notes = notes;
        if (status === 'Delivered') {
            assignment.deliveredAt = Date.now();
            await Order.findByIdAndUpdate(assignment.orderId, { 
                status: 'Delivered',
                $push: { statusHistory: { status: 'Delivered', note: 'Delivered by: ' + req.user.name } }
            });
        } else if (status === 'In Transit') {
            await Order.findByIdAndUpdate(assignment.orderId, { 
                status: 'Out for Delivery',
                $push: { statusHistory: { status: 'Out for Delivery', note: 'Marked as in transit' } }
            });
        }

        await assignment.save();
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Smart Route Suggestion (Logic Simulation) ---

exports.suggestRoutes = async (req, res) => {
    const { city, zip } = req.query;
    try {
        // Simple logic: match city or zip with route stops
        const routes = await BusRoute.find({
            stops: { $in: [city, zip] }
        });
        res.json(routes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
