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

exports.updateBus = async (req, res) => {
    try {
        const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bus) return res.status(404).json({ message: 'Vehicle not found' });
        res.json(bus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteBus = async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) return res.status(404).json({ message: 'Vehicle not found' });

        const activeCount = await DeliveryAssignment.countDocuments({ 
            busId: req.params.id, 
            status: { $in: ['Assigned', 'In Transit'] } 
        });
        if (activeCount > 0) {
            return res.status(400).json({ message: 'Cannot delete vehicle with active assignments' });
        }

        await Bus.findByIdAndDelete(req.params.id);
        res.json({ message: 'Vehicle purged from fleet successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Delivery Assignment (Admin) ---

exports.assignDelivery = async (req, res) => {
    const { orderId, deliveryBoyId, busId, routeId, notes, pickupStoppage, estimatedArrivalTime, vehicleName } = req.body;
    try {
        const result = await processAssignment({
            orderId, deliveryBoyId, busId, routeId, notes, pickupStoppage, estimatedArrivalTime, vehicleName
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.bulkAssignDelivery = async (req, res) => {
    const { orderIds, deliveryBoyId, busId, routeId, notes, pickupStoppage, estimatedArrivalTime, vehicleName } = req.body;
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: 'No orders selected for bulk assignment' });
    }

    try {
        const results = [];
        const errors = [];

        for (const orderId of orderIds) {
            try {
                const result = await processAssignment({
                    orderId, deliveryBoyId, busId, routeId, notes, pickupStoppage, estimatedArrivalTime, vehicleName
                }, false); // Pass false to skip individual WhatsApp notifications
                results.push(result);
            } catch (err) {
                errors.push({ orderId, message: err.message });
            }
        }

        // Send a single WhatsApp notification for the batch
        const User = require('../models/User');
        const deliveryBoy = await User.findById(deliveryBoyId);
        if (deliveryBoy && deliveryBoy.mobile && results.length > 0) {
            const bus = await Bus.findById(busId);
            const whatsappService = require('../services/whatsappService');
            await whatsappService.sendDeliveryAssignmentNotification(
                deliveryBoy.mobile,
                deliveryBoy.name,
                vehicleName || bus?.busName || 'Vehicle',
                pickupStoppage,
                results.length // Pass count to service if supported, or just keep original
            );
        }

        res.status(200).json({ 
            success: true, 
            assignedCount: results.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Internal helper for assignment logic
const processAssignment = async (data, sendNotification = true) => {
    const { orderId, deliveryBoyId, busId, routeId, notes, pickupStoppage, estimatedArrivalTime, vehicleName } = data;
    
    // 1. Check if Order exists and is paid (or COD)
    const order = await Order.findById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const isPaid = order.paymentDetails && order.paymentDetails.status === 'Completed';
    const isCOD = order.paymentDetails && order.paymentDetails.method === 'COD';

    if (!isPaid && !isCOD) {
        throw new Error(`Order ${orderId} is unpaid`);
    }

    // 2. Check if already assigned to an active delivery
    const existingAssignment = await DeliveryAssignment.findOne({ 
        orderId, 
        status: { $in: ['Assigned', 'In Transit'] } 
    });
    if (existingAssignment) {
        throw new Error(`Order ${orderId} is already assigned`);
    }

    const assignment = await DeliveryAssignment.create({
        orderId,
        deliveryBoyId,
        busId,
        routeId,
        pickupStoppage,
        estimatedArrivalTime,
        vehicleName,
        notes
    });

    // 3. Sync dispatch details to Order
    const bus = await Bus.findById(busId);
    const route = await BusRoute.findById(routeId);

    await Order.findByIdAndUpdate(orderId, { 
        status: 'Out for Delivery',
        $push: { statusHistory: { status: 'Out for Delivery', note: `Assigned to ${bus?.busName || 'Vehicle'} (${bus?.busNumber || 'N/A'})` } },
        $set: {
            dispatchDetails: {
                busId: bus?._id,
                busNumber: bus?.busNumber,
                busName: bus?.busName,
                vehicleName,
                conductorNumber: bus?.mobileNumber, 
                routeName: route?.routeName,
                busImage: bus?.image,
                pickupStoppage,
                estimatedArrivalTime,
                dispatchedAt: Date.now()
            }
        }
    });

    // 4. WhatsApp Notification (if single assignment)
    if (sendNotification) {
        const User = require('../models/User');
        const deliveryBoy = await User.findById(deliveryBoyId);
        if (deliveryBoy && deliveryBoy.mobile) {
            const whatsappService = require('../services/whatsappService');
            await whatsappService.sendDeliveryAssignmentNotification(
                deliveryBoy.mobile,
                deliveryBoy.name,
                vehicleName || bus?.busName || 'Vehicle',
                pickupStoppage
            );
        }
    }

    return assignment;
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
            deliveryBoyId: req.user._id
        })
        .populate({
            path: 'orderId',
            populate: { path: 'user', select: 'name mobile' }
        })
        .populate('busId')
        .populate('routeId')
        .sort({ updatedAt: -1 });

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.bulkUpdateAssignmentStatus = async (req, res) => {
    const { assignmentIds, status, notes, driverNumber, actualDepartureTime, handoverImage } = req.body;
    
    if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) {
        return res.status(400).json({ message: 'No assignments selected' });
    }

    try {
        const results = [];
        const errors = [];

        for (const id of assignmentIds) {
            try {
                const assignment = await DeliveryAssignment.findById(id);
                if (!assignment) throw new Error(`Assignment ${id} not found`);

                // SECURITY: Verify ownership
                if (assignment.deliveryBoyId.toString() !== req.user._id.toString()) {
                    throw new Error(`Not authorized for assignment ${id}`);
                }

                assignment.status = status;
                if (notes) assignment.notes = notes;

                if (status === 'Delivered') {
                    assignment.deliveredAt = Date.now();
                    assignment.handoverImage = handoverImage;
                    assignment.driverNumber = driverNumber;
                    assignment.actualDepartureTime = actualDepartureTime || Date.now();

                    await Order.findByIdAndUpdate(assignment.orderId, { 
                        status: 'Delivered',
                        $push: { statusHistory: { status: 'Delivered', note: 'Bulk Delivered by: ' + req.user.name } },
                        $set: {
                            'dispatchDetails.actualDepartureTime': assignment.actualDepartureTime,
                            'dispatchDetails.conductorNumber': assignment.driverNumber || undefined,
                            'dispatchDetails.busImage': assignment.handoverImage || undefined
                        }
                    });

                    // Send WhatsApp Notification to Customer
                    try {
                        const updatedOrder = await Order.findById(assignment.orderId).populate('user', 'name mobile');
                        const bus = await Bus.findById(assignment.busId);
                        
                        if (updatedOrder && updatedOrder.user && updatedOrder.user.mobile) {
                            const whatsappService = require('../services/whatsappService');
                            await whatsappService.sendOrderShippedToBusNotification(
                                updatedOrder.user.mobile,
                                updatedOrder.user.name,
                                updatedOrder._id,
                                bus?.busName || 'Express Vehicle',
                                bus?.busNumber || 'N/A'
                            );
                        }
                    } catch (notifyErr) {
                        console.error("Bulk Handover WhatsApp Notification Error:", notifyErr);
                    }
                } else if (status === 'In Transit') {
                    await Order.findByIdAndUpdate(assignment.orderId, { 
                        status: 'Out for Delivery',
                        $push: { statusHistory: { status: 'Out for Delivery', note: 'Marked as in transit (Bulk)' } }
                    });
                }

                await assignment.save();
                results.push(assignment);
            } catch (err) {
                errors.push({ id, message: err.message });
            }
        }

        res.json({ 
            success: true, 
            updatedCount: results.length,
            errors: errors.length > 0 ? errors : undefined
        });
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
            assignment.handoverImage = req.body.handoverImage;
            assignment.driverNumber = req.body.driverNumber;
            assignment.actualDepartureTime = req.body.actualDepartureTime || Date.now();

            await Order.findByIdAndUpdate(assignment.orderId, { 
                status: 'Delivered',
                $push: { statusHistory: { status: 'Delivered', note: 'Delivered by: ' + req.user.name } },
                $set: {
                    'dispatchDetails.actualDepartureTime': assignment.actualDepartureTime,
                    'dispatchDetails.conductorNumber': assignment.driverNumber || undefined,
                    'dispatchDetails.busImage': assignment.handoverImage || undefined
                }
            });

            // Send WhatsApp Notification to Customer
            try {
                const updatedOrder = await Order.findById(assignment.orderId).populate('user', 'name mobile');
                const bus = await Bus.findById(assignment.busId);
                
                if (updatedOrder && updatedOrder.user && updatedOrder.user.mobile) {
                    const whatsappService = require('../services/whatsappService');
                    await whatsappService.sendOrderShippedToBusNotification(
                        updatedOrder.user.mobile,
                        updatedOrder.user.name,
                        updatedOrder._id,
                        bus?.busName || 'Express Vehicle',
                        bus?.busNumber || 'N/A'
                    );
                }
            } catch (notifyErr) {
                console.error("Handover WhatsApp Notification Error:", notifyErr);
            }
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
