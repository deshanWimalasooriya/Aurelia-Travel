const express = require('express');
const router = express.Router();
const notifyController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Get all
router.get('/', notifyController.getMyNotifications);

// Mark single as read (This is the backend logic you requested)
router.put('/:id/read', notifyController.markRead);

// Mark all
router.put('/read-all', notifyController.markAllRead);

module.exports = router;