const platformModel = require('../models/platformModel');
const bcrypt = require('bcrypt'); // ✅ Ensure bcrypt is imported
const { sendNotification, notifyAdmins } = require('./notificationController');
const logService = require('../services/logService'); // ✅ IMPORT SERVICE

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
        await platformModel.deleteReview(req.params.id);
        res.json({ success: true, message: 'Review removed' });
    } catch (err) {
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

        // Only log if something actually changed
        if (changes.length > 0) {
            await logService.logAction(
                req.user.userId,       // Who did it?
                'UPDATE_CONFIG',       // Action Code
                'System',              // Module
                'Platform Settings',   // Target
                changes.join(', '),    // Details: "Commission: 5% -> 8%"
                'warning'              // Status (Orange badge)
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
        const formatted = logs.map(log => ({
            id: log.id,
            admin: log.admin_name || 'System',
            action: log.action_type,
            target: log.target,
            module: log.module,
            timestamp: log.created_at,
            status: log.status,
            details: log.details
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error("Logs Error:", err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

// ==========================================
// CONTACT MESSAGES
// ==========================================
// 🔓 PUBLIC: Submit Form
exports.submitContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) return res.status(400).json({ error: "Missing fields" });
        
        await platformModel.createContactMessage({ name, email, message });
        
        // Alert Super Admins in real-time
        await notifyAdmins("New Inquiry", `Message received from ${name} (${email}).`, "info", "/superAdmin/messages");

        res.json({ success: true, message: "Message sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// 🔒 ADMIN: Get all messages
exports.getMessages = async (req, res) => {
    try {
        const messages = await platformModel.getContactMessages();
        res.json({ success: true, data: messages });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch messages' }); }
};

// 🔒 ADMIN: Mark as read
exports.markMessageRead = async (req, res) => {
    try {
        await platformModel.updateMessageStatus(req.params.id, 'read');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update' }); }
};

// 🔒 ADMIN: Delete message
exports.deleteMessage = async (req, res) => {
    try {
        await platformModel.deleteMessage(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete' }); }
};