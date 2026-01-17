const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);
router.get('/hotel/:hotelId', roomController.getRoomsByHotelId);

// Manager
router.get('/mine', verifyToken, checkRole('admin', 'HotelManager'), roomController.getMyRooms);

// Protected CRUD
router.post('/', verifyToken, checkRole('admin', 'HotelManager'), roomController.createRoom);
router.put('/:id', verifyToken, checkRole('admin', 'HotelManager'), roomController.updateRoom);
router.delete('/:id', verifyToken, checkRole('admin', 'HotelManager'), roomController.deleteRoom);

module.exports = router;