const platformModel = require('../models/platformModel');
const bcrypt = require('bcrypt'); // ✅ Ensure bcrypt is imported
const { sendNotification, notifyAdmins } = require('./notificationController');
const logService = require('../services/logService');
const reviewModel = require('../models/reviewModel');

// ... (Existing Overview and Hotel functions) ...

exports.getPlatformOverview = async (req, res) => {
    try {
        const [revenueResult, userResult, hotelResult, recentBookings] = await Promise.all([
            platformModel.getPlatformRevenue(),
            platformModel.getUserCount(),
            platformModel.getHotelCount(),
            platformModel.getRecentActivity()
        ]);

        res.json({
            success: true,
            stats: {
                totalRevenue: parseFloat(revenueResult?.total || 0),
                totalUsers: parseInt(userResult?.count || 0),
                totalHotels: parseInt(hotelResult?.count || 0),
            },
            recentActivity: recentBookings
        });
    } catch (err) {
        console.error("Overview Stats Error:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllHotels = async (req, res) => {
    try {
        const hotels = await platformModel.getAllHotelsWithManagers();
        res.json(hotels);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch hotels' });
    }
};

exports.updateHotelStatus = async (req, res) => {
    try {
        await platformModel.updateHotelStatus(req.params.id, req.body.is_active);
        res.json({ success: true, message: 'Hotel status updated' });

        // --- TRIGGER: Notify Manager ---
        // Need to find manager ID first. Assuming we can get hotel owner details:
        const allHotels = await platformModel.getAllHotelsWithManagers();
        const hotel = allHotels.find(h => h.id == id);

        if (hotel && hotel.manager_id) {
            const statusMsg = is_active ? "Live" : "Deactivated";
            await sendNotification(
                hotel.manager_id,
                `Hotel Status: ${statusMsg}`,
                `Your property "${hotel.name}" is now ${statusMsg}.`,
                is_active ? "success" : "error",
                "/admin/hotels"
            );
        }
        // ------------------------------
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
};

// --- User Management ---

exports.getAllUsers = async (req, res) => {
    try {
        const users = await platformModel.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// ✅ NEW: Fully update user (Role, Password, Details)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, ...updateData } = req.body;

        // If password is provided, hash it
        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await platformModel.updateUser(id, updateData);
        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
};

exports.manageUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'ban' or 'delete'
        const adminId = req.user.userId;

        // Fetch user name for the log target
        const targetUser = await platformModel.getUserById(id);
        const targetName = targetUser ? `${targetUser.username} (${targetUser.email})` : `User ID ${id}`;

        if (action === 'delete') {
            await platformModel.deleteUser(id);
            
            // ✅ LOG DELETE
            await logService.logAction(adminId, 'DELETE_USER', 'Users', targetName, 'Admin permanently deleted user account.');
            
            return res.json({ success: true, message: 'User deleted' });
        }
        
        if (action === 'ban') {
            if (!targetUser) return res.status(404).json({ error: 'User not found' });
            
            const newStatus = !targetUser.is_active;
            await platformModel.updateUserStatus(id, newStatus);
            
            // ✅ LOG BAN/UNBAN
            const logAction = newStatus ? 'ACTIVATE_USER' : 'BAN_USER';
            const logDetail = newStatus ? 'User account reactivated.' : 'User account suspended by admin.';
            await logService.logAction(adminId, logAction, 'Users', targetName, logDetail, 'warning');

            return res.json({ success: true, message: 'User status updated' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Action failed' });
    }
};

// ... (Rest of Finance, Reviews, Settings functions remain unchanged) ...
exports.getPlatformTransactions = async (req, res) => {
    try {
        const transactions = await platformModel.getAllTransactions();
        res.json(transactions);
    } catch (err) {
        console.error("Finance error:", err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await platformModel.getRecentReviews();
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.id;

        // 1. Fetch the review so we know which hotel it belongs to
        const review = await platformModel.getReviewById(reviewId);
        
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // 2. Delete the review
        await platformModel.deleteReview(reviewId);
        
        // 3. ✅ RECALCULATE the hotel's overall average rating
        await reviewModel.updateHotelRating(review.hotel_id);
        
        // 4. Log the action
        await logService.logAction(
            req.user.userId, 
            'DELETE_REVIEW', 
            'Moderation', 
            `Review ID: ${reviewId}`, 
            'Admin permanently removed a guest review.', 
            'error'
        );

        res.json({ success: true, message: 'Review removed and hotel rating updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Delete failed' }); 
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await platformModel.getSettings();
        res.json(settings || { commission_rate: 5, support_email: 'admin@aurelia.com', maintenance_mode: false });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        // 1. Fetch OLD settings first (to compare)
        const oldSettings = await platformModel.getSettings();
        
        // 2. Perform Update
        await platformModel.updateSettings(req.body);
        
        // 3. ✅ CALCULATE CHANGES FOR LOG
        let changes = [];
        
        // Check Commission
        if (req.body.commission_rate !== undefined && oldSettings.commission_rate != req.body.commission_rate) {
            changes.push(`Commission: ${oldSettings.commission_rate}% -> ${req.body.commission_rate}%`);
        }
        
        // Check Maintenance Mode
        if (req.body.maintenance_mode !== undefined && oldSettings.maintenance_mode != req.body.maintenance_mode) {
            changes.push(`Maintenance: ${req.body.maintenance_mode ? 'ENABLED' : 'DISABLED'}`);
        }

        for (const key in req.body) {
            if (oldSettings[key] != req.body[key]) {
                 changes.push(`${key}: '${oldSettings[key] || ''}' -> '${req.body[key]}'`);
            }
        }

        if (changes.length > 0) {
            await logService.logAction(
                req.user.userId, 'UPDATE_CONFIG', 'System', 'Platform Settings', changes.join(' | '), 'warning'
            );
        }

        res.json({ success: true, message: 'Settings saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
};

// ... existing code ...

exports.getSystemLogs = async (req, res) => {
    try {
        const { search, date, action } = req.query;
        const logs = await platformModel.getActivityLogs({ search, date, action });
        
        // Format for frontend
        const formatted = logs.map(log => {
            let exactTime = log.created_at;
            
            // ✅ FIX: Safely force the database time into a strict UTC string.
            // This prevents the server from applying its own timezone, allowing 
            // your React app in Sri Lanka to correctly add the +5:30 offset itself.
            if (exactTime instanceof Date) {
                exactTime = exactTime.toISOString();
            } else if (typeof exactTime === 'string' && !exactTime.endsWith('Z')) {
                // If MySQL returned a raw string without a timezone, append 'Z' (UTC marker)
                exactTime += 'Z'; 
            }

            return {
                id: log.id,
                admin: log.admin_name || 'System',
                action: log.action_type,
                target: log.target,
                module: log.module,
                timestamp: exactTime, 
                status: log.status,
                details: log.details
            };
        });

        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error("Logs Error:", err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

// ==========================================
// SETTINGS & CONTACT SYSTEM
// ==========================================

// 🔓 PUBLIC: Safe settings for the frontend (Footer, Contact page)
exports.getPublicSettings = async (req, res) => {
    try {
        const settings = await platformModel.getSettings();
        if (settings) {
            delete settings.commission_rate;
            delete settings.maintenance_mode;
        }
        res.json(settings || {}); // Returns directly so res.data works on frontend
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public settings' });
    }
};

// 🔒 ADMIN: Returns everything including financial configurations
exports.getAdminSettings = async (req, res) => {
    try {
        const settings = await platformModel.getSettings();
        res.json(settings || { commission_rate: 5.0, support_email: 'support@aureliatravel.com' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// 🔓 PUBLIC: Submit Contact Form
exports.submitContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) return res.status(400).json({ error: "Missing fields" });
        
        await platformModel.createContactMessage({ name, email, message });
        
        // Alert Super Admins via Socket/Notification
        const { notifyAdmins } = require('./notificationController');
        if (notifyAdmins) {
             await notifyAdmins("New Inquiry", `Message received from ${name}.`, "info", "/superAdmin/messages");
        }

        res.json({ success: true, message: "Message sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// 🔒 ADMIN: Message Management
exports.getMessages = async (req, res) => {
    try {
        const messages = await platformModel.getContactMessages();
        res.json({ success: true, data: messages });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch messages' }); }
};

exports.markMessageRead = async (req, res) => {
    try {
        await platformModel.updateMessageStatus(req.params.id, 'read');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update' }); }
};

exports.deleteMessage = async (req, res) => {
    try {
        await platformModel.deleteMessage(req.params.id);
        // ✅ LOG MESSAGE DELETION
        await logService.logAction(req.user.userId, 'DELETE_MESSAGE', 'Support', `Inbox Msg ID: ${req.params.id}`, 'Admin deleted a support message.', 'error');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete' }); }
};

// 🔓 PUBLIC: Safe settings for the frontend (Footer, Contact page)
exports.getPublicSettings = async (req, res) => {
    try {
        const settings = await platformModel.getSettings();
        
        if (settings) {
            // SECURITY: Never expose financial configurations to the public
            delete settings.commission_rate;
            delete settings.maintenance_mode;
        }
        
        res.json({
            success: true, 
            data: settings
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public settings' });
    }
};

// 🔓 PUBLIC: Get basic platform stats for the welcome page
exports.getPublicStats = async (req, res) => {
    try {
        const [userResult, hotelResult] = await Promise.all([
            platformModel.getUserCount(),
            platformModel.getHotelCount()
        ]);

        res.json({
            success: true,
            data: {
                users: parseInt(userResult?.count || 0),
                hotels: parseInt(hotelResult?.count || 0)
            }
        });
    } catch (err) {
        console.error("Public Stats Error:", err);
        res.status(500).json({ error: 'Failed to fetch public stats' });
    }
};