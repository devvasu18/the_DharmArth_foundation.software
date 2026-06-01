const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getPublicPharmacySettings, getPublicAppVersionSettings } = require('../controllers/settingsController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

router.get('/pharmacy/public', getPublicPharmacySettings);
router.get('/app-version/public', getPublicAppVersionSettings);
router.get('/', protect, checkPermission('Settings', 'view'), getSettings);
router.patch('/', protect, checkPermission('Settings', 'edit'), updateSettings);

module.exports = router;
