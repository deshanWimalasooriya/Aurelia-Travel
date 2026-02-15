const notificationModel = require('../models/notificationModel');

// --- INTERNAL HELPER (Use this in other controllers) ---
exports.sendNotification = async (userId, title, message, type = 'info', link = null) => {
    try {
        await notificationModel.create({ 
            user_id: userId, 
            title, 
            message, 
            type, 
            link 
        });
    } catch (err) {
        console.error("Failed to create notification:", err);
    }
};

// --- PUBLIC API ENDPOINTS ---

// 1. Get My Notifications
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [notifications, unreadData] = await Promise.all([
            notificationModel.getByUserId(userId),
            notificationModel.getUnreadCount(userId)
        ]);
        
        res.json({ 
            success: true, 
            notifications, 
            unreadCount: unreadData || 0 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Mark One as Read
exports.markRead = async (req, res) => {
    try {
        await notificationModel.markAsRead(req.params.id, req.user.userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Mark All as Read
exports.markAllRead = async (req, res) => {
    try {
        await notificationModel.markAllAsRead(req.user.userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};