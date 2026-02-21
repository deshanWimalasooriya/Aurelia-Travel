const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/', chatController.getHistory);
router.get('/active', checkRole('admin'), chatController.getActiveChats);
router.post('/', chatController.sendMessage);

module.exports = router;