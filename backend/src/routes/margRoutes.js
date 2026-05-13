const express = require('express');
const router = express.Router();
const margController = require('../controllers/margController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// All routes are admin only
router.use(protect);
router.use(adminOnly);

router.get('/products', margController.getProducts);
router.get('/parties', margController.getParties);
router.get('/stocks', margController.getStocks);
router.get('/invoices', margController.getInvoices);
router.get('/search-products', margController.searchProductsWithStock);
router.post('/check-stock-bulk', margController.checkStockBulk);
router.post('/sync', margController.triggerSync);

module.exports = router;
