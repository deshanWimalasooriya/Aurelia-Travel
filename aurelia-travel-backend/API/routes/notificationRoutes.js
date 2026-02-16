const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Get all
router.get('/', notifController.getMyNotifications);

// Mark single as read (This is the backend logic you requested)
router.put('/:id/read', notifController.markRead);

// Mark all
router.put('/read-all', notifController.markAllRead);

module.exports = router;