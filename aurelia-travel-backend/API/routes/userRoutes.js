const express = require('express')
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole, checkOwnership } = require('../middleware/authMiddleware');

// GET /api/users - Get all users (admin only)
router.get('/', checkRole('admin'), userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', checkOwnership, userController.updateUser);
router.delete('/:id', checkRole('admin'), userController.deleteUser);

module.exports = router;