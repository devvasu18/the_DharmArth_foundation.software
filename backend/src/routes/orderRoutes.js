const express = require('express');
const router = express.Router();
const { 
    getMyOrders, 
    getOrderById, 
    getAllOrders, 
    updateOrderStatus,
    downloadInvoice
} = require('../controllers/orderController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

router.get('/my', protect, getMyOrders);
router.get('/public/:id/invoice', downloadInvoice); // Publicly accessible via tracking link
router.get('/public/:id', getOrderById); // Added for shareable tracking links
router.get('/:id/invoice', protect, downloadInvoice);
router.get('/:id', protect, getOrderById);
router.get('/', protect, checkPermission('Order Management', 'view'), getAllOrders);
router.patch('/:id/status', protect, checkPermission('Order Management', 'edit'), updateOrderStatus);

module.exports = router;
