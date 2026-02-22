// API/controllers/notificationController.js
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel'); 
const { notifyUser } = require('../socket'); 

// 1. Send Notification to a Single User
exports.sendNotification = async (userId, title, message, type = 'info', link = null) => {
    try {
        // A. Save to Database
        const result = await notificationModel.create({ 
            user_id: userId, 
            title, 
            message, 
            type, 
            link 
        });
        
        // Handle Knex return (it returns an array of IDs like [1])
        const newId = Array.isArray(result) ? result[0] : result;

        // B. Push Real-Time to Frontend via Socket
        if (notifyUser) {
            notifyUser(userId, {
                id: newId,
                user_id: userId,
                title,
                message,
                type,
                link,
                is_read: 0, 
                created_at: new Date()
            });
        }

    } catch (err) {
        console.error("Failed to create notification:", err);
    }
};

// 2. Notify All Admins
exports.notifyAdmins = async (title, message, type = 'info', link = null) => {
    try {
        const admins = await userModel.getAdmins();
        
        if (!admins || admins.length === 0) return;

        // Loop through all admins and send the notification
        // Using a loop guarantees individual socket events are fired
        for (const admin of admins) {
            await exports.sendNotification(admin.id, title, message, type, link);
        }
        
    } catch (err) {
        console.error("Admin Notification Error:", err);
    }
};

// --- PUBLIC API ENDPOINTS ---

// 3. Get Logged-in User's Notifications
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const [notifications, unreadData] = await Promise.all([
            notificationModel.getByUserId(userId),
            notificationModel.getUnreadCount(userId)
        ]);
        
        const count = unreadData && unreadData.count ? unreadData.count : 0;

        res.json({ 
            success: true, 
            notifications, 
            unreadCount: count 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Mark a Single Notification as Read
exports.markRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.userId;

        await notificationModel.markAsRead(notificationId, userId);
        res.json({ success: true, message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Mark ALL Notifications as Read
exports.markAllRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        await notificationModel.markAllAsRead(userId);
        res.json({ success: true, message: "All marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};