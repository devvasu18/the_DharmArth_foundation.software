const express = require('express');
const router = express.Router();
const reportController = require('../controllers/doctorReportController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { uploadReport } = require('../config/cloudinaryReports');

// Admin Routes (secured)
router.post('/send', protect, adminOnly, uploadReport.array('files', 15), reportController.createReport);
router.get('/', protect, adminOnly, reportController.getReports);
router.post('/retry/:id', protect, adminOnly, reportController.retryReport);

// Public Patient Access Routes
router.get('/metadata/:token', reportController.getReportMetadata);
router.get('/view/:token', reportController.streamSecureReport);

module.exports = router;
