const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const MargErpService = require('../services/margErpService');

// @desc    Upload Prescription
// @route   POST /api/prescriptions
// @access  Private
exports.uploadPrescription = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a prescription image' });
        }

        const prescription = await Prescription.create({
            user: req.user._id,
            image: req.file.path, // Cloudinary URL
            status: 'Pending'
        });

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
        const prescriptions = await Prescription.find({ user: req.user._id }).sort({ createdAt: -1 });
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await Prescription.countDocuments();
        const prescriptions = await Prescription.find()
            .populate('user', 'name mobile email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            prescriptions,
            page,
            totalPages: Math.ceil(total / limit),
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

        prescription.verifiedItems = itemsWithStock;
        prescription.status = 'Verified';
        prescription.adminNote = adminNote;
        prescription.verificationLog.push({
            status: 'Verified',
            updatedBy: req.user._id,
            note: 'Verified items and checked stock'
        });

        await prescription.save();
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

        if (prescription.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Filter out unavailable items
        const availableItems = prescription.verifiedItems.filter(item => item.isAvailable);
        if (availableItems.length === 0) {
            return res.status(400).json({ message: 'No items are currently available' });
        }

        let totalAmount = 0;
        const orderItems = availableItems.map(item => {
            totalAmount += item.price * (item.quantity || 1);
            return {
                name: item.medicineName,
                quantity: item.quantity || 1,
                price: item.price,
                dosage: item.dosage
            };
        });

        const order = await Order.create({
            user: req.user._id,
            prescription: prescription._id,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentDetails: {
                method: paymentMethod || 'Online',
                status: 'Pending'
            },
            status: 'Payment Pending'
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
