const express = require('express');
const router = express.Router();
const { 
    uploadPrescription, 
    getMyPrescriptions, 
    getAllPrescriptions, 
    verifyPrescription, 
    approveAndCreateOrder,
    getPublicPrescription 
} = require('../controllers/prescriptionController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.post('/', protect, upload.single('prescription'), uploadPrescription);
router.get('/my', protect, getMyPrescriptions);
router.get('/', protect, checkPermission('Prescription Management', 'view'), getAllPrescriptions);
router.patch('/:id/verify', 
    protect, 
    checkPermission('Prescription Management', 'edit'), 
    [
        body('status').isIn(['Verified', 'Rejected']),
        body('adminNote').optional().isString(),
        body('verifiedItems').if(body('status').equals('Verified')).isArray().notEmpty(),
    ],
    validate,
    verifyPrescription
);
router.get('/:id/public', getPublicPrescription);
router.post('/:id/approve', (req, res, next) => {
    // Optional protection: if session exists, great. If not, we still allow for shareable links.
    next();
}, approveAndCreateOrder);

module.exports = router;
