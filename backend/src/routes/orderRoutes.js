const express = require('express');
const router = express.Router();
const { 
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
    refundAdvanceOrder,
    pushOrderToMarg
} = require('../controllers/orderController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

router.get('/my', protect, getMyOrders);
router.get('/guest-history/:mobile', getGuestOrders);
router.get('/advance-orders', protect, getAdvanceOrders);
router.get('/advance-orders/restocked', protect, getRestockedAdvanceOrders);
router.get('/packing-queue', protect, getPackingQueue);
router.post('/:id/pack', protect, markOrderPacked);
router.post('/:id/refund-advance', protect, refundAdvanceOrder);
router.post('/:id/recalculate-price', protect, recalculateRestockedPrice);
router.post('/:id/push-marg', protect, checkPermission('Order Management', 'edit'), pushOrderToMarg);
router.get('/public/:id/invoice', downloadInvoice); // Publicly accessible via tracking link
router.get('/public/:id', getOrderById); // Added for shareable tracking links
router.get('/:id/invoice', protect, downloadInvoice);
router.get('/:id', protect, getOrderById);
router.get('/', protect, checkPermission('Order Management', 'view'), getAllOrders);
router.patch('/:id/status', protect, checkPermission('Order Management', 'edit'), updateOrderStatus);

module.exports = router;

