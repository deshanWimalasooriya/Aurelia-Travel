const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get My Profile (Protected)
router.get('/me', verifyToken, userController.getCurrentUser);

// ✅ CRITICAL FIX: Specific routes must come BEFORE dynamic routes (/:id)
router.put('/upgrade-to-manager', verifyToken, userController.upgradeToManager);

// Get All Users (Admin Only)
router.get('/', verifyToken, checkRole('admin'), userController.getAllUsers);

// Dynamic ID Routes
router.get('/:id', verifyToken, userController.getUserById);
router.put('/:id', verifyToken, userController.updateUser);
router.delete('/:id', verifyToken, checkRole('admin'), userController.deleteUser);
router.post('/', userController.createUser);

module.exports = router;