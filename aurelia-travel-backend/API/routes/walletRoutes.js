const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { verifyToken } = require('../middleware/authMiddleware');

// Base Path: /api/wallet (Configured in server.js)

// 1. Get all saved cards
router.get('/', verifyToken, walletController.getMyWallet);

// 2. Add a new card (Tokenized)
router.post('/', verifyToken, walletController.addMethod);

// 3. Remove a card
router.delete('/:id', verifyToken, walletController.removeMethod);

module.exports = router;