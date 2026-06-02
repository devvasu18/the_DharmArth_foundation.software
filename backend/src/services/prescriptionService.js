const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const NotificationService = require('./notificationService');

/**
 * Handles post-payment completion for prescriptions
 */
exports.completeOrder = async (orderId, paymentId, io) => {
    try {
        const Payment = require('../models/Payment');
        const payment = await Payment.findOne({ order_id: orderId });

        if (!payment || payment.type !== 'prescription' || !payment.prescriptionId) {
            return;
        }

        const prescription = await Prescription.findById(payment.prescriptionId).populate('user');
        if (!prescription) return;

        // Idempotency: only process if not already ordered
        if (prescription.status === 'Ordered') return;

        // 1. Create the formal Order record
        const availableItems = prescription.verifiedItems.filter(item => item.isAvailable);
        const orderItems = availableItems.map(item => ({
            name: item.medicineName,
            quantity: item.quantity || 1,
            price: item.price,
            dosage: item.dosage,
            frequency: item.frequency,
            time: item.time,
            foodRelation: item.foodRelation,
            intakeMethod: item.intakeMethod
        }));

        const newOrder = await Order.create({
            user: prescription.user?._id || payment.userId,
            prescription: prescription._id,
            items: orderItems,
            totalAmount: payment.amount,
            shippingAddress: prescription.pendingShippingAddress || {},
            paymentDetails: {
                method: 'Online',
                transactionId: paymentId,
                status: 'Completed'
            },
            status: 'Processing',
            orderType: 'Medicine',
            orderSource: prescription.orderSource || 'Website'
        });

        // 2. Update prescription state
        prescription.status = 'Ordered';
        prescription.verificationLog.push({
            status: 'Ordered',
            updatedBy: prescription.user?._id || payment.userId,
            note: `Payment successful (Razorpay: ${paymentId}). Formal Order #${newOrder._id} created.`
        });
        
        await prescription.save();

        // 3. Notify user and admin
        if (prescription.user) {
            await NotificationService.notify({
                userId: prescription.user._id,
                type: 'ORDER_CONFIRMED',
                message: `Your payment of ₹${payment.amount} was successful. Order #${newOrder._id} is being processed.`,
                referenceId: prescription._id,
                onModel: 'Prescription',
                io
            });

            // Notify Admin
            await NotificationService.notifyOrderPaidAdmin(newOrder, prescription.user, io);
        }

        console.log(`Prescription Order completed. Formal Order ID: ${newOrder._id}`);
    } catch (error) {
        console.error("Error in prescriptionService.completeOrder:", error);
    }
};
