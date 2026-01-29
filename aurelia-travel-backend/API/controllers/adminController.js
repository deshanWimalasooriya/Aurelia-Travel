const adminModel = require('../models/adminModel');

// 1. Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await adminModel.getGlobalStats();
        
        // Add icons or formatting if needed for frontend
        const formattedStats = [
            { label: 'Total Bookings', value: stats.total_bookings, change: '+12%', icon: '📅' },
            { label: 'Total Revenue', value: `$${stats.total_revenue.toLocaleString()}`, change: '+8%', icon: '💰' },
            { label: 'Active Hotels', value: stats.active_hotels, change: '+2', icon: '🏨' },
            { label: 'Active Users', value: stats.active_users, change: '+24', icon: '👥' }
        ];

        res.json({ success: true, stats: formattedStats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Recent Bookings (for Dashboard Widget)
exports.getRecentBookings = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const data = await adminModel.getRecentActivity(limit);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Analytics (Charts)
exports.getAnalytics = async (req, res) => {
    try {
        const revenue = await adminModel.getMonthlyRevenue();
        const status = await adminModel.getBookingsByStatus();
        res.json({ 
            success: true, 
            revenue_chart: revenue, 
            status_breakdown: status 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Financial Data
exports.getFinancialData = async (req, res) => {
    try {
        const data = await adminModel.getFinancialSummary();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ==========================================
// USER MANAGEMENT
// ==========================================
exports.getUsers = async (req, res) => {
    try {
        const filters = {
            role: req.query.role,
            search: req.query.search
        };
        const users = await adminModel.getAllUsers(filters);
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await adminModel.updateUser(req.params.id, req.body);
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await adminModel.deleteUser(req.params.id);
        res.json({ success: true, message: 'User deactivated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ==========================================
// HOTEL MANAGEMENT
// ==========================================
exports.getHotels = async (req, res) => {
    try {
        const hotels = await adminModel.getAllHotelsForAdmin();
        res.json({ success: true, data: hotels });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateHotel = async (req, res) => {
    try {
        const hotel = await adminModel.updateHotel(req.params.id, req.body);
        res.json({ success: true, data: hotel });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.toggleHotelStatus = async (req, res) => {
    try {
        const hotel = await adminModel.toggleHotelStatus(req.params.id);
        res.json({ success: true, data: hotel });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ==========================================
// BOOKING MANAGEMENT
// ==========================================
exports.getBookings = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const bookings = await adminModel.getAllBookingsForAdmin(filters);
        res.json({ success: true, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const booking = await adminModel.updateBookingStatus(req.params.id, req.body.status);
        res.json({ success: true, data: booking });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ==========================================
// REVIEW MANAGEMENT
// ==========================================
exports.getReviews = async (req, res) => {
    try {
        const filters = { is_approved: req.query.is_approved };
        const reviews = await adminModel.getAllReviews(filters);
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.toggleReview = async (req, res) => {
    try {
        const review = await adminModel.toggleReviewApproval(req.params.id);
        res.json({ success: true, data: review });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        await adminModel.deleteReview(req.params.id);
        res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};