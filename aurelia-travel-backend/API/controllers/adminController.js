const adminModel = require('../models/adminModel');

// ========================================
// DASHBOARD OVERVIEW
// ========================================
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await adminModel.getGlobalStats();
        const netRevenue = stats.total_revenue * 0.15;

        const formattedStats = [
            { label: 'Total Bookings', value: stats.total_bookings, icon: '📅', change: '+12%' },
            { label: 'Gross Volume', value: `$${stats.total_revenue.toLocaleString()}`, icon: '💳', change: '+8%' },
            { label: 'Net Revenue (15%)', value: `$${netRevenue.toLocaleString()}`, icon: '💰', change: '+15%' },
            { label: 'Active Hotels', value: stats.active_hotels, icon: '🏨', change: '+3%' }
        ];

        res.json({ success: true, stats: formattedStats });
    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getRecentBookings = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const recent = await adminModel.getRecentActivity(limit);
        res.json({ success: true, data: recent });
    } catch (err) {
        console.error('Recent Bookings Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAnalyticsData = async (req, res) => {
    try {
        const monthly = await adminModel.getMonthlyRevenue();
        const statusBreakdown = await adminModel.getBookingsByStatus();
        const topHotels = await adminModel.getTopHotels();
        
        res.json({ 
            success: true, 
            revenue_chart: monthly,
            status_breakdown: statusBreakdown,
            top_hotels: topHotels
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getFinancialData = async (req, res) => {
    try {
        const summary = await adminModel.getFinancialSummary();
        res.json({ success: true, data: summary });
    } catch (err) {
        console.error('Financial Data Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ========================================
// USER MANAGEMENT
// ========================================
exports.getAllUsers = async (req, res) => {
    try {
        const filters = {
            role: req.query.role,
            search: req.query.search
        };
        const users = await adminModel.getAllUsers(filters);
        res.json({ success: true, data: users });
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await adminModel.updateUser(id, req.body);
        res.json({ success: true, message: 'User updated', data: updated });
    } catch (err) {
        console.error('Update User Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await adminModel.deleteUser(id);
        res.json({ success: true, message: 'User deactivated' });
    } catch (err) {
        console.error('Delete User Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ========================================
// HOTEL MANAGEMENT
// ========================================
exports.getAllHotels = async (req, res) => {
    try {
        const hotels = await adminModel.getAllHotelsForAdmin();
        res.json({ success: true, data: hotels });
    } catch (err) {
        console.error('Get Hotels Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateHotel = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await adminModel.updateHotel(id, req.body);
        res.json({ success: true, message: 'Hotel updated', data: updated });
    } catch (err) {
        console.error('Update Hotel Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.toggleHotelStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await adminModel.toggleHotelStatus(id);
        res.json({ 
            success: true, 
            message: `Hotel ${hotel.is_active ? 'activated' : 'deactivated'}`, 
            data: hotel 
        });
    } catch (err) {
        console.error('Toggle Hotel Status Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ========================================
// BOOKING MANAGEMENT
// ========================================
exports.getAllBookings = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };
        const bookings = await adminModel.getAllBookingsForAdmin(filters);
        res.json({ success: true, data: bookings });
    } catch (err) {
        console.error('Get Bookings Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updated = await adminModel.updateBookingStatus(id, status);
        res.json({ success: true, message: 'Booking updated', data: updated });
    } catch (err) {
        console.error('Update Booking Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ========================================
// REVIEW MANAGEMENT
// ========================================
exports.getAllReviews = async (req, res) => {
    try {
        const filters = {
            is_approved: req.query.is_approved
        };
        const reviews = await adminModel.getAllReviews(filters);
        res.json({ success: true, data: reviews });
    } catch (err) {
        console.error('Get Reviews Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.toggleReviewApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await adminModel.toggleReviewApproval(id);
        res.json({ 
            success: true, 
            message: `Review ${review.is_approved ? 'approved' : 'rejected'}`, 
            data: review 
        });
    } catch (err) {
        console.error('Toggle Review Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        await adminModel.deleteReview(id);
        res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        console.error('Delete Review Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
