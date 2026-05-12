const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const donationService = require('../services/donationService');

// Use a simple random generator if uuid not available, but let's check package.json again
// Checking package.json... bcryptjs, cloudinary, mongoose... no uuid.
// I'll use a simple generator or install uuid. I'll use crypto.randomBytes for now.

const generateTransactionId = () => {
    return 'TXN_' + crypto.randomBytes(10).toString('hex').toUpperCase();
};

/**
 * @desc Create a new Razorpay Order
 * @route POST /api/payment/create-order
 */
exports.createOrder = async (req, res) => {
    try {
        const { amount: frontendAmount, currency = 'INR', userId, email, contact, prescriptionId, type = 'donation', shippingAddress } = req.body;

        if (!frontendAmount || (!userId && type === 'donation')) {
            return res.status(400).json({ success: false, message: 'Amount and userId are required' });
        }

        let amount = frontendAmount;

        // Security: Recalculate amount if it's a prescription order
        if (type === 'prescription' && prescriptionId) {
            const Prescription = require('../models/Prescription');
            const prescription = await Prescription.findById(prescriptionId);
            if (!prescription) {
                return res.status(404).json({ success: false, message: 'Prescription not found' });
            }
            
            const calculatedAmount = prescription.verifiedItems
                .filter(item => item.isAvailable)
                .reduce((acc, item) => acc + (item.price || 0), 0);
            
            // If frontend amount is significantly different, we might want to log it, 
            // but we'll use the calculated one for security.
            amount = calculatedAmount;

            // Store shipping address in prescription for later completion
            if (shippingAddress) {
                prescription.pendingShippingAddress = shippingAddress;
                await prescription.save();
            }
        }

        const transaction_id = generateTransactionId();

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency,
            receipt: transaction_id,
        };

        const order = await razorpay.orders.create(options);

        // Store initial payment record in DB
        const payment = new Payment({
            userId,
            amount,
            currency,
            transaction_id,
            order_id: order.id,
            status: 'created',
            email,
            contact,
            prescriptionId,
            type
        });

        await payment.save();

        res.status(201).json({
            success: true,
            order_id: order.id,
            transaction_id,
            amount: options.amount,
            currency: options.currency
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
};

/**
 * @desc Verify Payment Signature (Frontend Call)
 * @route POST /api/payment/verify-payment
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }

        // HMAC_SHA256(order_id + "|" + payment_id, key_secret)
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update DB status
            const payment = await Payment.findOneAndUpdate(
                { order_id: razorpay_order_id },
                { 
                    status: 'paid', 
                    payment_id: razorpay_payment_id,
                    // If frontend sends method/email/contact, we can update here too
                    // but webhook is final source of truth
                },
                { new: true }
            );

            res.status(200).json({ success: true, message: 'Payment verified successfully', payment });

            // Trigger post-payment logic based on type
            try {
                const io = req.app.get('io');
                if (payment.type === 'prescription') {
                    const prescriptionService = require('../services/prescriptionService');
                    await prescriptionService.completeOrder(razorpay_order_id, razorpay_payment_id, io);
                } else {
                    await donationService.completeDonation(razorpay_order_id, razorpay_payment_id, io);
                }
            } catch (err) {
                console.error("Post-payment completion failed (verify):", err);
            }
        } else {
            await Payment.findOneAndUpdate({ order_id: razorpay_order_id }, { status: 'failed' });
            res.status(400).json({ success: false, message: 'Signature mismatch. Payment verification failed.' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * @desc Verify Subscription Signature (First Payment)
 * @route POST /api/payment/verify-subscription
 */
exports.verifySubscription = async (req, res) => {
    try {
        const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }

        // HMAC_SHA256(payment_id + "|" + subscription_id, key_secret)
        const body = razorpay_payment_id + "|" + razorpay_subscription_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const subscriptionService = require('../services/subscriptionService');
            const io = req.app.get('io');
            
            // Activate and process first payment
            await subscriptionService.handleSubscriptionCharged(razorpay_subscription_id, razorpay_payment_id, {
                payment: { entity: { id: razorpay_payment_id, amount: 0, order_id: null } }, // Service will fetch real amount if needed
                subscription: { entity: { id: razorpay_subscription_id } }
            }, io);

            res.status(200).json({ success: true, message: 'Subscription verified and activated' });
        } else {
            res.status(400).json({ success: false, message: 'Signature mismatch. Subscription verification failed.' });
        }
    } catch (error) {
        console.error('Error verifying subscription:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * @desc Mark Payment/Subscription as Failed (Frontend Call)
 * @route POST /api/payment/mark-failed
 */
exports.markFailed = async (req, res) => {
    try {
        const { order_id, subscription_id } = req.body;

        if (subscription_id) {
            const Subscription = require('../models/Subscription');
            await Subscription.findOneAndUpdate({ subscriptionId: subscription_id }, { status: 'failed' });
        }
        
        if (order_id) {
            await Payment.findOneAndUpdate({ order_id }, { status: 'failed' });
        }

        res.status(200).json({ success: true, message: 'Marked as failed' });
    } catch (error) {
        console.error('Error marking as failed:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * @desc Razorpay Webhook Handler (Final Source of Truth)
 * @route POST /api/payment/webhook
 */
exports.handleWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        
        // Verification needs the RAW body
        const signature = req.headers['x-razorpay-signature'];
        
        // Validate webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(req.rawBody) // req.rawBody must be populated by middleware
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('Invalid Webhook Signature');
            return res.status(400).send('Invalid signature');
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`Processing Razorpay Webhook Event: ${event}`);

        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentDetails = payload.payment ? payload.payment.entity : payload.order.entity;
            const order_id = paymentDetails.order_id;
            const payment_id = paymentDetails.id || (payload.payment ? payload.payment.entity.id : null);

            // Check if it's a subscription payment (subscriptions don't have an order_id in some events, but have subscription_id)
            if (paymentDetails.subscription_id) {
                const subscriptionService = require('../services/subscriptionService');
                const io = req.app.get('io');
                await subscriptionService.handleSubscriptionCharged(paymentDetails.subscription_id, payment_id, payload, io);
                return res.status(200).json({ status: 'ok' });
            }

            // Find payment by order_id (for one-time orders)
            const payment = await Payment.findOne({ order_id });
            // ... existing logic for one-time payments ...
            if (payment) {
                // Idempotency check: only update if not already paid
                if (payment.status !== 'paid') {
                    payment.status = 'paid';
                    payment.payment_id = payment_id;
                    payment.payment_method = paymentDetails.method;
                    payment.email = paymentDetails.email || payment.email;
                    payment.contact = paymentDetails.contact || payment.contact;
                    payment.raw_webhook_data = req.body;
                    await payment.save();
                    
                    // Trigger post-payment logic based on type
                    try {
                        const io = req.app.get('io');
                        if (payment.type === 'prescription') {
                            const prescriptionService = require('../services/prescriptionService');
                            await prescriptionService.completeOrder(order_id, payment_id, io);
                        } else {
                            await donationService.completeDonation(order_id, payment_id, io);
                        }
                    } catch (err) {
                        console.error("Post-payment completion failed (webhook):", err);
                    }
                    
                    console.log(`Payment confirmed for Order ${order_id}`);
                } else {
                    console.log(`Order ${order_id} already marked as paid. Skipping update.`);
                }
            } else {
                console.warn(`Payment record not found for Order ID: ${order_id}`);
            }
        } else if (event === 'subscription.charged') {
            const payment_id = payload.payment.entity.id;
            const subscription_id = payload.subscription.entity.id;
            const subscriptionService = require('../services/subscriptionService');
            const io = req.app.get('io');
            await subscriptionService.handleSubscriptionCharged(subscription_id, payment_id, payload, io);
        } else if (event.startsWith('subscription.')) {
            const subscription_id = payload.subscription.entity.id;
            const status = payload.subscription.entity.status;
            const subscriptionService = require('../services/subscriptionService');
            await subscriptionService.handleSubscriptionStatusUpdate(subscription_id, status);
        } else if (event === 'payment.failed') {
             const paymentDetails = payload.payment.entity;
             const order_id = paymentDetails.order_id;
             const subscription_id = paymentDetails.subscription_id;

             if (subscription_id) {
                 // Mark subscription as having a failing payment if needed
                 console.log(`Payment failed for subscription: ${subscription_id}`);
                 const Subscription = require('../models/Subscription');
                 await Subscription.findOneAndUpdate({ subscriptionId: subscription_id }, { status: 'failed' });
             }

             if (order_id) {
                await Payment.findOneAndUpdate({ order_id }, { status: 'failed', raw_webhook_data: req.body });
             }
        }

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Webhook Processing Failed');
    }
};
