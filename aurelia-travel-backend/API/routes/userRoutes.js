const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get My Profile (Protected)
router.get('/me', verifyToken, userController.getCurrentUser);

// Get All Users (Admin Only)
router.get('/', verifyToken, checkRole('admin'), userController.getAllUsers);

// Get Specific User
router.get('/:id', verifyToken, userController.getUserById);

router.post('/', userController.createUser);
router.put('/:id', verifyToken, userController.updateUser);
router.delete('/:id', verifyToken, checkRole('admin'), userController.deleteUser);

router.put('/upgrade-to-manager', verifyToken, userController.upgradeToManager);

module.exports = router;