const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
// You might want to add auth middleware for getLeads and updateLeadStatus
// const { protect, admin } = require('../middlewares/authMiddleware'); 
// Assuming you have such middleware. I'll add them if I see them in other routes.

router.post('/', leadController.createLead);
router.get('/user/:userId', leadController.getLeadByUserId);
router.get('/', leadController.getLeads); // Add protection logic if needed
router.get('/:id', leadController.getLeadById);
router.post('/:id/messages', leadController.addMessageToLead);
router.put('/:id', leadController.updateLeadStatus); // Add protection logic if needed

module.exports = router;
