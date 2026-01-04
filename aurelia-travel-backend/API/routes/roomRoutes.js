const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public routes
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);

// Protected routes (Admin only)
router.post('/', verifyToken, checkRole('admin'), roomController.createRoom);
router.put('/:id', verifyToken, checkRole('admin'), roomController.updateRoom);
router.delete('/:id', verifyToken, checkRole('admin'), roomController.deleteRoom);

// get rooms by hotel id
router.get('/hotel/:hotelId', roomController.getRoomsByHotelId);

module.exports = router;