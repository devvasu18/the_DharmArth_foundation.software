const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const MargErpService = require('../services/margErpService');
const notificationService = require('../services/notificationService');

// @desc    Upload Prescription
// @route   POST /api/prescriptions
// @access  Private
exports.uploadPrescription = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a prescription image' });
        }

        let userId = req.user ? req.user._id : null;
        let guestInfo = {};

        // If guest upload, handle user creation/lookup
        if (!userId && req.body.guestMobile) {
            let user = await User.findOne({ mobile: req.body.guestMobile });
            if (!user) {
                user = await User.create({
                    name: req.body.guestName || 'Guest User',
                    mobile: req.body.guestMobile,
                    roles: [] // Default guest roles if any
                });
            }
            userId = user._id;
            guestInfo = {
                name: req.body.guestName,
                mobile: req.body.guestMobile
            };
        }

        if (!userId) {
            return res.status(400).json({ message: 'User identification required' });
        }

        let parsedFaqAnswers = [];
        if (req.body.faqAnswers) {
            try {
                parsedFaqAnswers = JSON.parse(req.body.faqAnswers);
            } catch (e) {
                console.error("Failed to parse faqAnswers:", e);
            }
        }

        const prescription = await Prescription.create({
            user: userId,
            image: req.file.path, // Cloudinary URL
            status: 'Pending',
            notes: req.body.notes,
            faqAnswers: parsedFaqAnswers,
            guestName: guestInfo.name,
            guestMobile: guestInfo.mobile
        });

        // Notify admin
        const io = req.app.get('io');
        const userData = req.user || await User.findById(userId);
        await notificationService.notifyPrescriptionUploadedAdmin(prescription, userData, io);

        res.status(201).json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's prescriptions
// @route   GET /api/prescriptions/my
// @access  Private
exports.getMyPrescriptions = async (req, res) => {
    try {
        const query = { user: req.user._id };
        
        // If recent=true, filter by last 90 days
        if (req.query.recent === 'true') {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            query.createdAt = { $gte: ninetyDaysAgo };
        }

        const prescriptions = await Prescription.find(query).sort({ createdAt: -1 });
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all prescriptions (Admin)
// @route   GET /api/prescriptions
// @access  Private/Admin
exports.getAllPrescriptions = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (status && status !== 'All') {
            query.status = status;
        }

        const total = await Prescription.countDocuments(query);
        const prescriptions = await Prescription.find(query)
            .populate('user', 'name mobile email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            prescriptions,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify Prescription (Admin)
// @route   PATCH /api/prescriptions/:id/verify
// @access  Private/Admin
exports.verifyPrescription = async (req, res) => {
    const { verifiedItems, adminNote, status } = req.body;
    try {
        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // If status is rejected
        if (status === 'Rejected') {
            prescription.status = 'Rejected';
            prescription.adminNote = adminNote;
            prescription.verificationLog.push({
                status: 'Rejected',
                updatedBy: req.user._id,
                note: adminNote
            });
            await prescription.save();
            return res.json(prescription);
        }

        // Check stock via MARG ERP Simulation for each item
        const itemsWithStock = await MargErpService.checkStockAndPrice(verifiedItems);

        // Provisioning Logic: If any item is shortlisted, require user approval
        const hasShortlisted = verifiedItems.some(item => item.fulfillmentStatus === 'Shortlisted');
        
        prescription.verifiedItems = verifiedItems.map(item => {
            const stockInfo = itemsWithStock.find(si => si.medicineName === item.medicineName);
            return {
                ...item,
                isAvailable: stockInfo ? stockInfo.isAvailable : true,
                fulfillmentStatus: item.fulfillmentStatus || 'In Stock'
            };
        });

        prescription.status = 'Verified';
        prescription.approvalRequired = hasShortlisted;
        prescription.userApproved = !hasShortlisted; // Auto-approved if everything is in stock
        prescription.adminNote = adminNote;
        prescription.verificationLog.push({
            status: 'Verified',
            updatedBy: req.user._id,
            note: hasShortlisted ? 'Provision bill generated with shortlisted items. Waiting for user approval.' : 'Verified items and checked stock. All items in stock.'
        });

        await prescription.save();

        // Notify User
        const populatedPrescription = await Prescription.findById(prescription._id).populate('user');
        if (populatedPrescription && populatedPrescription.user) {
            const io = req.app.get('io');
            if (hasShortlisted) {
                await notificationService.notify({
                    userId: populatedPrescription.user._id,
                    type: 'APPROVAL_REQUIRED',
                    message: 'Your medicine order has some items currently out of stock. Please approve the provision bill to proceed with packing in-stock items.',
                    referenceId: prescription._id,
                    onModel: 'Prescription',
                    io
                });
            } else {
                await notificationService.notifyPrescriptionVerifiedUser(populatedPrescription, populatedPrescription.user, io);
            }
        }

        res.json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve and Create Order (User)
// @route   POST /api/prescriptions/:id/approve
// @access  Private
exports.approveAndCreateOrder = async (req, res) => {
    const { shippingAddress, paymentMethod } = req.body;
    try {
        const prescription = await Prescription.findById(req.params.id);
        if (!prescription || prescription.status !== 'Verified') {
            return res.status(400).json({ message: 'Invalid or unverified prescription' });
        }

        // For shareable links, we allow skip of ownership check if the prescription is verified.
        // If req.user is missing, it's a guest payment for someone else.

        // Filter out unavailable items
        const availableItems = prescription.verifiedItems.filter(item => item.isAvailable);
        if (availableItems.length === 0) {
            return res.status(400).json({ message: 'No items are currently available' });
        }

        let subtotal = 0;
        const orderItems = availableItems.map(item => {
            subtotal += (item.price || 0);
            return {
                name: item.medicineName,
                quantity: item.quantity || 1,
                price: item.price,
                dosage: item.dosage,
                frequency: item.frequency,
                time: item.time,
                foodRelation: item.foodRelation,
                intakeMethod: item.intakeMethod,
                margPack: item.margPack,
                margBatch: item.margBatch,
                margExpiry: item.margExpiry,
                margBillNo: item.margBillNo,
                fulfillmentStatus: item.fulfillmentStatus === 'Shortlisted' ? 'Shortlisted' : 'Packed'
            };
        });

        // Financial Calculations
        const { getPharmacyConfig } = require('./settingsController');
        const config = await getPharmacyConfig();

        const gst = subtotal * (config.gstPercent / 100); 
        const platformFee = subtotal * (config.platformFeePercent / 100);
        
        let deliveryCharge = 0;
        if (config.deliveryChargeType === 'flat') {
            deliveryCharge = config.flatDeliveryCharge;
        } else {
            // Percent based
            if (subtotal < config.percentDeliveryThreshold) {
                deliveryCharge = subtotal * (config.percentDeliveryBelowThreshold / 100);
            } else {
                deliveryCharge = subtotal * (config.percentDeliveryAboveThreshold / 100);
            }
        }

        const totalAmount = subtotal + gst + platformFee + deliveryCharge;

        // The order should always be associated with the prescription owner, 
        // even if someone else pays for it.
        const order = await Order.create({
            user: prescription.user, 
            prescription: prescription._id,
            items: orderItems,
            totalAmount,
            financials: {
                subtotal,
                gst,
                platformFee,
                deliveryCharge
            },
            shippingAddress,
            paymentDetails: {
                method: paymentMethod || 'Online',
                status: 'Pending'
            },
            status: 'Payment Pending'
        });

        // Mutate prescription state to prevent overlapping checkout duplication
        prescription.status = 'Ordered';
        prescription.verificationLog.push({
            status: 'Ordered',
            updatedBy: req.user?._id || prescription.user,
            note: 'Converted to formal Order'
        });
        await prescription.save();

        // -------------------------------------------------------------
        // NEW: Address Management Logic
        // -------------------------------------------------------------
        if (req.user && req.user._id && shippingAddress) {
            const user = await User.findById(req.user._id);
            if (user) {
                // Check if this specific address (by ID or fields) already exists
                const existingAddrIndex = user.savedAddresses.findIndex(addr => 
                    (shippingAddress._id && addr._id.toString() === shippingAddress._id) ||
                    (addr.street === shippingAddress.street && addr.zip === shippingAddress.zip)
                );

                if (existingAddrIndex > -1) {
                    // Update existing if fields changed
                    user.savedAddresses[existingAddrIndex].street = shippingAddress.street;
                    user.savedAddresses[existingAddrIndex].city = shippingAddress.city;
                    user.savedAddresses[existingAddrIndex].state = shippingAddress.state;
                    user.savedAddresses[existingAddrIndex].zip = shippingAddress.zip;
                    user.savedAddresses[existingAddrIndex].phone = shippingAddress.phone;
                    user.savedAddresses[existingAddrIndex].altPhone = shippingAddress.altPhone;
                    user.savedAddresses[existingAddrIndex].updatedAt = Date.now();
                } else {
                    // Save as new address
                    user.savedAddresses.push({
                        street: shippingAddress.street,
                        city: shippingAddress.city,
                        state: shippingAddress.state,
                        zip: shippingAddress.zip,
                        phone: shippingAddress.phone,
                        altPhone: shippingAddress.altPhone
                    });
                }
                await user.save();
            }
        }
        // -------------------------------------------------------------

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    User Approves Provision Bill
// @route   POST /api/prescriptions/:id/approve-provision
// @access  Private
exports.approveProvisionBill = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
        
        prescription.userApproved = true;
        prescription.verificationLog.push({
            status: 'Verified',
            updatedBy: req.user?._id || prescription.user,
            note: 'User approved the provision bill (including shortlisted items).'
        });
        
        await prescription.save();
        res.json({ success: true, message: 'Provision bill approved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get public prescription for checkout
// @route   GET /api/prescriptions/:id/public
// @access  Public
exports.getPublicPrescription = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('user', 'name mobile savedAddresses');
        
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Only allow viewing if it is Verified or Ordered
        if (prescription.status !== 'Verified' && prescription.status !== 'Ordered') {
            return res.status(403).json({ message: 'This prescription is not available for public viewing' });
        }

        const response = prescription.toObject();

        if (prescription.status === 'Ordered') {
            const order = await Order.findOne({ prescription: prescription._id }).sort({ createdAt: -1 });
            if (order) {
                response.orderId = order._id;
                response.totalPaid = order.totalAmount;
            }
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Re-submit an existing prescription as a new request
// @route   POST /api/prescriptions/:id/re-submit
// @access  Private
exports.reSubmitPrescription = async (req, res) => {
    try {
        const oldPrescription = await Prescription.findById(req.params.id);
        if (!oldPrescription) {
            return res.status(404).json({ message: 'Original prescription not found' });
        }

        // Create a new record using the same image and user
        const newPrescription = await Prescription.create({
            user: req.user._id,
            image: oldPrescription.image,
            status: 'Pending',
            notes: `Re-order request from previous prescription #${oldPrescription._id.toString().slice(-6)}.`,
            // Carry over verified items to help the pharmacist, but they will need to re-verify stock
            verifiedItems: oldPrescription.verifiedItems
        });

        // Notify admin
        const io = req.app.get('io');
        const user = await User.findById(req.user._id);
        await notificationService.notifyPrescriptionUploadedAdmin(newPrescription, user, io);

        res.status(201).json(newPrescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get guest prescriptions history
// @route   GET /api/prescriptions/guest-history/:mobile
// @access  Public
exports.getGuestHistory = async (req, res) => {
    try {
        const { mobile } = req.params;
        const user = await User.findOne({ mobile });

        if (!user) {
            return res.json([]);
        }

        // Security Check: If user has a password, they must login
        if (user.password) {
            return res.status(401).json({ 
                message: 'This account is registered. Please login to view history.',
                loginRequired: true 
            });
        }

        const prescriptions = await Prescription.find({ user: user._id })
            .sort({ createdAt: -1 });
        
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
