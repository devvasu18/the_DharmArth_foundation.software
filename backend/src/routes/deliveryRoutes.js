const express = require('express');
const router = express.Router();
const { 
    createRoute, 
    getRoutes, 
    createBus, 
    getBusesByRoute, 
    assignDelivery, 
    getAssignedOrders, 
    updateAssignmentStatus,
    suggestRoutes
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
router.post('/buses', 
    protect, 
    checkPermission('Delivery Management', 'create'), 
    [
        body('busNumber').notEmpty(),
        body('routeId').isMongoId(),
        body('timing').notEmpty()
    ], 
    validate, 
    createBus
);
router.get('/routes/:routeId/buses', protect, getBusesByRoute);

// Assignment
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
