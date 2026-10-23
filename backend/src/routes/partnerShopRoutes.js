const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @desc    Get all orders assigned to the logged-in village partner shop
 * @route   GET /api/partner-shop/orders
 * @access  Private (Partner Shop / Admin)
 */
router.get('/orders', protect, async (req, res) => {
    try {
        const query = {
            $or: [
                { 'partnerShop.partnerId': req.user._id },
                { 'partnerShop.shopName': new RegExp(req.user.name, 'i') },
                { 'shippingAddress.villageName': { $exists: true, $ne: '' } }
            ]
        };

        const orders = await Order.find(query)
            .populate('user', 'name mobile')
            .populate('dispatchDetails.busId')
            .sort({ updatedAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('Error fetching partner shop orders:', error);
        res.status(500).json({ message: 'Failed to fetch partner shop orders' });
    }
});

/**
 * @desc    Village Partner marks parcel received from bus conductor
 * @route   POST /api/partner-shop/orders/:id/receive-bus
 * @access  Private (Partner Shop)
 */
router.post('/orders/:id/receive-bus', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = 'Arrived at Partner Shop';
        if (!order.partnerShop) order.partnerShop = {};
        order.partnerShop.receivedFromBusAt = new Date();
        order.partnerShop.partnerId = req.user._id;
        
        // Generate a 4-digit pickup OTP if not set
        if (!order.partnerShop.pickupOtp) {
            order.partnerShop.pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
        }

        order.statusHistory.push({
            status: 'Arrived at Partner Shop',
            note: `Parcel received from bus conductor by partner ${req.user.name}`
        });

        await order.save();

        // Trigger SMS/WhatsApp alert with pickup OTP to patient
        try {
            const populatedOrder = await Order.findById(order._id).populate('user');
            const notificationService = require('../services/notificationService');
            await notificationService.notifyOrderArrivedAtPartnerShop(
                populatedOrder, 
                populatedOrder.user, 
                req.user, 
                req.app.get('io')
            );
        } catch (notifErr) {
            console.error("Failed to notify patient of bus parcel arrival:", notifErr);
        }

        res.json({ message: 'Parcel marked as received in shop', order });
    } catch (error) {
        console.error('Error receiving bus parcel:', error);
        res.status(500).json({ message: 'Failed to record bus receipt' });
    }
});

/**
 * @desc    Verify OTP and handover parcel to patient (collect COD if applicable)
 * @route   POST /api/partner-shop/orders/:id/handover-otp
 * @access  Private (Partner Shop)
 */
router.post('/orders/:id/handover-otp', protect, async (req, res) => {
    try {
        const { otp, cashCollected } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // If OTP provided, verify it (or allow override if admin/partner confirms identity)
        if (order.partnerShop?.pickupOtp && otp) {
            if (order.partnerShop.pickupOtp !== otp.trim()) {
                return res.status(400).json({ message: 'Invalid OTP. Please verify with patient.' });
            }
        }

        order.status = 'Delivered';
        if (order.partnerShop) {
            order.partnerShop.codCollected = Boolean(cashCollected);
            if (cashCollected) {
                order.partnerShop.codAmount = order.paymentDetails?.method === 'PARTNER_COD' 
                    ? (order.advancePaymentDetails?.balanceDue || order.totalAmount) 
                    : 0;
            }
        }

        if (order.paymentDetails?.method === 'PARTNER_COD') {
            order.paymentDetails.status = 'Completed';
        }

        order.statusHistory.push({
            status: 'Delivered',
            note: `Handed over to patient by village partner ${req.user.name}. COD collected: ${cashCollected ? 'YES' : 'NO'}`
        });

        await order.save();
        res.json({ message: 'Medicine handed over to patient successfully!', order });
    } catch (error) {
        console.error('Error completing partner handover:', error);
        res.status(500).json({ message: 'Failed to complete handover' });
    }
});

module.exports = router;
