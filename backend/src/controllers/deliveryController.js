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

exports.updateRoute = async (req, res) => {
    try {
        const route = await BusRoute.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json(route);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteRoute = async (req, res) => {
    try {
        const route = await BusRoute.findById(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });

        // Check if any buses are assigned to this route
        const busesCount = await Bus.countDocuments({ routeId: req.params.id });
        if (busesCount > 0) {
            return res.status(400).json({ message: 'Cannot delete route with assigned buses. Delete buses first.' });
        }

        await BusRoute.findByIdAndDelete(req.params.id);
        res.json({ message: 'Route deleted successfully' });
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

// --- Delivery Dashboard Data (Admin) ---

exports.getUnassignedOrders = async (req, res) => {
    try {
        // Fetch orders that are not delivered/cancelled, and are either PAID or COD
        const orders = await Order.find({
            status: { $nin: ['Delivered', 'Cancelled'] },
            $or: [
                { 'paymentDetails.status': 'Completed' },
                { 'paymentDetails.method': 'COD' }
            ]
        })
        .populate('user', 'name mobile email')
        .sort({ createdAt: -1 });

        // Filter out those already assigned to active deliveries (Not Delivered/Failed)
        const activeAssignments = await DeliveryAssignment.find({
            status: { $in: ['Assigned', 'In Transit'] }
        });
        const assignedOrderIds = activeAssignments.map(a => a.orderId.toString());

        const unassignedOrders = orders.filter(o => !assignedOrderIds.includes(o._id.toString()));

        res.json(unassignedOrders);
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

// --- Smart Route Suggestion Engine ---

exports.suggestRoutes = async (req, res) => {
    const { address, city, state, zip } = req.query;
    try {
        const queryTerms = [address, city, state, zip]
            .filter(term => term && term.trim() !== '')
            .map(term => {
                // Escape regex characters and break into words for max matching
                return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split(' ');
            })
            .flat()
            .filter(word => word.length > 2); // Ignore tiny words like "St", "Rd"

        if (queryTerms.length === 0) {
            return res.json([]);
        }

        // Create case-insensitive regex for each significant word
        const regexTerms = queryTerms.map(term => new RegExp(term, 'i'));

        // Match ANY stop in the stops array that contains any of the geographical keywords
        const routes = await BusRoute.find({
            stops: { $in: regexTerms }
        });

        // Add scoring logic: How many stops match the user's search query terms?
        const scoredRoutes = routes.map(route => {
            let score = 0;
            route.stops.forEach(stop => {
                regexTerms.forEach(regex => {
                    if (regex.test(stop)) score++;
                });
            });
            // Convert to regular object to append score
            return { ...route.toObject(), relevanceScore: score };
        });

        // Sort by highest relevance score
        scoredRoutes.sort((a, b) => b.relevanceScore - a.relevanceScore);

        res.json(scoredRoutes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
