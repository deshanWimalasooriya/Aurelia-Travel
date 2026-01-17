const adminModel = require('../models/adminModel');

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await adminModel.getGlobalStats();
        
        // Calculate Aurelia's Share (15% Commission)
        const netRevenue = stats.total_revenue * 0.15;

        const formattedStats = [
            { label: 'Total Bookings', value: stats.total_bookings, icon: '📅' },
            { label: 'Gross Volume', value: `$${stats.total_revenue.toLocaleString()}`, icon: '💳' },
            { label: 'Net Revenue (15%)', value: `$${netRevenue.toLocaleString()}`, icon: '💰' },
            { label: 'Active Hotels', value: stats.active_hotels, icon: '🏨' }
        ];

        res.json({ success: true, stats: formattedStats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRecentBookings = async (req, res) => {
    try {
        const recent = await adminModel.getRecentActivity();
        res.json({ success: true, data: recent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAnalyticsData = async (req, res) => {
    try {
        const monthly = await adminModel.getMonthlyRevenue();
        res.json({ success: true, revenue_chart: monthly });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};