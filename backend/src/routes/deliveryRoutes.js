const express = require('express');
const router = express.Router();
const { 
    createRoute, 
    getRoutes, 
    updateRoute,
    deleteRoute,
    createBus, 
    getBusesByRoute, 
    assignDelivery,
    getUnassignedOrders,
    getAssignedOrders, 
    updateAssignmentStatus,
    suggestRoutes,
    updateBus,
    deleteBus
} = require('../controllers/deliveryController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Route management (Admin)
router.post('/routes', 
    protect, 
    checkPermission('Delivery Management', 'create'), 
    [
        body('routeName').notEmpty().trim(),
        body('stops').isArray({ min: 1 })
    ], 
    validate, 
    createRoute
);
router.get('/routes', protect, getRoutes);
router.put('/routes/:id', protect, checkPermission('Delivery Management', 'edit'), updateRoute);
router.delete('/routes/:id', protect, checkPermission('Delivery Management', 'delete'), deleteRoute);
router.post('/buses', 
    protect, 
    checkPermission('Delivery Management', 'create'), 
    [
        body('busNumber').notEmpty(),
        body('routeId').isMongoId()
    ], 
    validate, 
    createBus
);
router.get('/routes/:routeId/buses', protect, getBusesByRoute);
router.put('/buses/:id', protect, checkPermission('Delivery Management', 'edit'), updateBus);
router.delete('/buses/:id', protect, checkPermission('Delivery Management', 'delete'), deleteBus);

// Assignment
router.get('/unassigned-orders', protect, checkPermission('Delivery Management', 'view'), getUnassignedOrders);
router.post('/assign', 
    protect, 
    checkPermission('Delivery Management', 'edit'), 
    [
        body('orderId').isMongoId(),
        body('deliveryBoyId').isMongoId()
    ], 
    validate, 
    assignDelivery
);
router.get('/suggest-routes', protect, suggestRoutes);

// Delivery Boy Dashboard
router.get('/my-assignments', protect, getAssignedOrders);
router.patch('/assignments/:id/status', protect, updateAssignmentStatus);

module.exports = router;
