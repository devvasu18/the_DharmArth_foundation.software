const express = require('express');
const router = express.Router();
const { 
    getMyOrders, 
    getOrderById, 
    getAllOrders, 
    updateOrderStatus 
} = require('../controllers/orderController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/', protect, checkPermission('Order Management', 'view'), getAllOrders);
router.patch('/:id/status', protect, checkPermission('Order Management', 'edit'), updateOrderStatus);

module.exports = router;
