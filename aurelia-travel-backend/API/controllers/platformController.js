const platformModel = require('../models/platformModel');
const bcrypt = require('bcrypt'); // ✅ Ensure bcrypt is imported

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
        const { action } = req.body; 

        if (action === 'delete') {
            await platformModel.deleteUser(id);
            return res.json({ success: true, message: 'User deleted' });
        }
        
        if (action === 'ban') {
            const user = await platformModel.getUserById(id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            
            await platformModel.updateUserStatus(id, !user.is_active);
            return res.json({ success: true, message: 'User status updated' });
        }
    } catch (err) {
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
        await platformModel.updateSettings(req.body);
        res.json({ success: true, message: 'Settings saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
};