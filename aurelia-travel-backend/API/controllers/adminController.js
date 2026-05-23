const adminModel = require('../models/adminModel');
const platformModel = require('../models/platformModel');

exports.getAnalyticsData = async (req, res) => {
    try {
        const [revenueTrends, byHotel, byStatus, hotelFinancialsRaw] = await Promise.all([
            adminModel.getMonthlyRevenue(),
            adminModel.getBookingsByHotel(),
            adminModel.getBookingStatusStats(),
            adminModel.getHotelFinancials()
        ]);

        let totalRevenue = 0;
        let totalCommission = 0;
        let totalBookings = 0;

        const hotelFinancials = hotelFinancialsRaw.map(h => {
            const rev = parseFloat(h.revenue || 0);
            const comm = parseFloat(h.commission || 0); // <-- Use exact DB value
            const bookingsCount = parseInt(h.bookings || 0, 10);
            
            totalRevenue += rev;
            totalCommission += comm;
            totalBookings += bookingsCount;

            return {
                id: h.id,
                name: h.name,
                bookings: bookingsCount,
                revenue: rev,
                commission: comm
            };
        });

        const responseData = {
            revenue: revenueTrends.map(r => ({ name: r.name, value: parseFloat(r.value || 0) })),
            byHotel: byHotel.map(h => ({ name: h.name, value: parseInt(h.value || 0, 10) })),
            byStatus: byStatus.map(s => ({ name: s.name, value: parseInt(s.value || 0, 10) })),
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

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await adminModel.getGlobalStats();
        
        const formattedStats = [
            { label: 'Total Bookings', value: stats.total_bookings, icon: '📅' },
            { label: 'Gross Volume', value: `$${parseFloat(stats.total_revenue).toLocaleString()}`, icon: '💰' },
            { label: 'Est. Commission', value: `$${parseFloat(stats.total_commission).toLocaleString()}`, icon: '💳' },
            { label: 'Active Hotels', value: stats.active_hotels, icon: '🏢' }
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

exports.getFinanceRecords = async (req, res) => {
    try {
        const transactions = await adminModel.getAllTransactions();
        res.json({ success: true, data: transactions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};