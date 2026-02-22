const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const walletController = require('../controllers/walletController'); // ✨ NEW
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// 1. Specific User Routes
router.get('/me', verifyToken, userController.getUserById); // Or getCurrentUser
router.get('/dashboard', verifyToken, userController.getTravelerDashboard); // ✨ NEW
router.put('/upgrade-to-manager', verifyToken, userController.upgradeToManager);

// 2. Wallet Routes (Nested here for convenience, or separate file)
router.get('/wallet', verifyToken, walletController.getMyWallet);
router.post('/wallet', verifyToken, walletController.addMethod);
router.delete('/wallet/:id', verifyToken, walletController.removeMethod);

// 3. Manager/Admin Routes
router.get('/my-customers', verifyToken, checkRole('admin', 'hotel_manager'), userController.getMyCustomers);
router.get('/', verifyToken, checkRole('admin'), userController.getAllUsers);
router.post('/', verifyToken, checkRole('admin'), userController.createUser);

// 4. Dynamic Routes (Last)
router.get('/:id', verifyToken, userController.getUserById);
router.put('/:id', verifyToken, userController.updateUser);
router.delete('/:id', verifyToken, checkRole('admin'), userController.deleteUser);

module.exports = router;