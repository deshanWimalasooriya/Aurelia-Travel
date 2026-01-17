const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// User Routes
router.post('/', verifyToken, crmController.createTicket);
router.get('/my-tickets', verifyToken, crmController.getMyTickets);

// Manager Routes
router.get('/manager/all', verifyToken, checkRole('admin', 'HotelManager'), crmController.getManagerTickets);
router.put('/:id/resolve', verifyToken, checkRole('admin', 'HotelManager'), crmController.resolveTicket);

module.exports = router;