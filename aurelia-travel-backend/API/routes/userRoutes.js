const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// =========================================================
// 1. SPECIFIC ROUTES (MUST BE DEFINED FIRST)
// =========================================================

// Get My Profile (Protected)
router.get('/me', verifyToken, userController.getCurrentUser);

// ✅ FIX: This specific route MUST come before the dynamic /:id route
// This prevents "upgrade-to-manager" from being treated as an ID
router.put('/upgrade-to-manager', verifyToken, userController.upgradeToManager);

// =========================================================
// 2. ADMIN LIST ROUTES
// =========================================================
router.get('/', verifyToken, checkRole('admin'), userController.getAllUsers);
router.post('/', userController.createUser);

// =========================================================
// 3. DYNAMIC ID ROUTES (MUST BE LAST)
// These catch anything else like /123, /456, etc.
// =========================================================
router.get('/:id', verifyToken, userController.getUserById);
router.put('/:id', verifyToken, userController.updateUser);
router.delete('/:id', verifyToken, checkRole('admin'), userController.deleteUser);

module.exports = router;