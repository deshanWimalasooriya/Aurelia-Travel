const adminModel = require('../models/adminModel');

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await adminModel.getStats();
        
        // Format data for the Frontend
        const formattedStats = [
            { label: 'Total Bookings', value: stats.bookings, icon: '📅', change: '+5%' },
            { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: '💰', change: '+12%' },
            { label: 'Registered Users', value: stats.users, icon: '👤', change: 'Active' },
            { label: 'Occupancy Rate', value: '85%', icon: '🏨', change: '-2%' } 
        ];

        res.json(formattedStats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getRecentBookings = async (req, res) => {
    try {
        const bookings = await adminModel.getRecentBookings();
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ NEW: Get Detailed Analytics
exports.getAnalyticsData = async (req, res) => {
    try {
        const managerId = req.user.userId || req.user.id;

        const [revenueData, hotelData, statusData] = await Promise.all([
            bookingModel.getMonthlyRevenue(managerId),
            bookingModel.getBookingsPerHotel(managerId),
            bookingModel.getBookingStatusStats(managerId)
        ]);

        res.json({
            revenue: revenueData,
            byHotel: hotelData,
            byStatus: statusData
        });
    } catch (err) {
        console.error("Analytics Error:", err);
        res.status(500).json({ error: err.message });
    }
};