const adminModel = require('../models/adminModel');

exports.getAnalyticsData = async (req, res) => {
    try {
        // Parallel Data Fetching for Performance
        const [revenueTrends, byHotel, byStatus, hotelFinancialsRaw] = await Promise.all([
            adminModel.getMonthlyRevenue(),
            adminModel.getBookingsByHotel(),
            adminModel.getBookingStatusStats(),
            adminModel.getHotelFinancials()
        ]);

        // Process Hotel Financials & Calculate Global Summary
        let totalRevenue = 0;
        let totalCommission = 0;
        let totalBookings = 0;

        const hotelFinancials = hotelFinancialsRaw.map(h => {
            const rev = parseFloat(h.revenue || 0);
            const rate = parseFloat(h.commission_rate || 5.00); // Default 5%
            const comm = rev * (rate / 100);
            
            // Add to totals
            totalRevenue += rev;
            totalCommission += comm;
            totalBookings += h.bookings;

            return {
                id: h.id,
                name: h.name,
                bookings: h.bookings,
                revenue: rev,
                commission: comm
            };
        });

        // Construct the Final Response Object
        const responseData = {
            revenue: revenueTrends, // [{name: 'Jan', value: 5000}, ...]
            byHotel: byHotel,       // [{name: 'Hotel A', value: 50}, ...]
            byStatus: byStatus,     // [{name: 'confirmed', value: 20}, ...]
            
            summary: {
                totalBookings: totalBookings,
                totalRevenue: totalRevenue,
                totalCommission: totalCommission,
                netIncome: totalRevenue - totalCommission
            },
            
            hotelFinancials: hotelFinancials
        };

        res.json(responseData);

    } catch (err) {
        console.error("Analytics Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Existing Endpoints (Preserved)
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await adminModel.getGlobalStats();
        const netRevenue = stats.total_revenue * 0.05; // Approx 5% estimate for header
        
        const formattedStats = [
            { label: 'Total Bookings', value: stats.total_bookings, icon: '📅' },
            { label: 'Gross Volume', value: `$${stats.total_revenue.toLocaleString()}`, icon: '💳' },
            { label: 'Est. Commission', value: `$${netRevenue.toLocaleString()}`, icon: '💰' },
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