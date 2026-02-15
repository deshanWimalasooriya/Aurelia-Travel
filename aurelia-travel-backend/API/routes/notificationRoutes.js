const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require login
router.use(verifyToken);

router.get('/', notifController.getMyNotifications);
router.put('/:id/read', notifController.markRead);
router.put('/read-all', notifController.markAllRead);

module.exports = router;