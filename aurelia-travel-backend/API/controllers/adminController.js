const adminModel = require('../models/adminModel');
const platformModel = require('../models/platformModel');

exports.getAnalyticsData = async (req, res) => {
    try {
        // Parallel Data Fetching for Performance
        const [revenueTrends, byHotel, byStatus, hotelFinancialsRaw, settings] = await Promise.all([
            adminModel.getMonthlyRevenue(),
            adminModel.getBookingsByHotel(),
            adminModel.getBookingStatusStats(),
            adminModel.getHotelFinancials(),
            platformModel.getSettings() 
        ]);

        const globalRate = settings ? parseFloat(settings.commission_rate) : 5.00;

        let totalRevenue = 0;
        let totalCommission = 0;
        let totalBookings = 0;

        const hotelFinancials = hotelFinancialsRaw.map(h => {
            const rev = parseFloat(h.revenue || 0);
            // ✨ Apply the live rate
            const rate = parseFloat(h.commission_rate || globalRate);
            const comm = rev * (rate / 100);
            
            // Fix: Parse string counts into actual integers
            const bookingsCount = parseInt(h.bookings || 0, 10);
            
            // Add to totals safely
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

        // Construct the Final Response Object
        const responseData = {
            // Fix: Force values to be numbers so Recharts library accepts them
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
    try {0

        // Fetch stats and settings together
        const [stats, settings] = await Promise.all([
            adminModel.getGlobalStats(),
            platformModel.getSettings()
        ]);

        const globalRate = settings ? parseFloat(settings.commission_rate) : 5.00;
        // ✨ Calculate header estimation using actual rate
        const netRevenue = stats.total_revenue * (globalRate / 100);
        
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

exports.getFinanceRecords = async (req, res) => {
    try {
        const transactions = await adminModel.getAllTransactions();
        res.json({ success: true, data: transactions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};