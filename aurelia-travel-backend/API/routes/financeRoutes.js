const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// All routes require Hotel Manager role
router.use(verifyToken, checkRole('admin', 'hotel_manager'));

router.get('/dashboard', financeController.getDashboard);
router.post('/pay', financeController.payCommission);
router.get('/analytics', financeController.getAnalytics);
router.get('/overview', financeController.getOverview);

module.exports = router;