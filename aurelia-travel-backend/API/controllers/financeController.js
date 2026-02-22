const financeModel = require('../models/financeModel');
const platformModel = require('../models/platformModel');

exports.getDashboard = async (req, res) => {
    try {
        const stats = await financeModel.getHotelStats(req.user.userId);
        const history = await financeModel.getPaymentHistory(req.user.userId);
        res.json({ success: true, stats, history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.payCommission = async (req, res) => {
    try {
        // req.body contains token from Stripe/Frontend
        const result = await financeModel.payCommission(req.user.userId, req.body);
        res.json({ success: true, message: "Commission Paid Successfully", data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- FIX: ANALYTICS ENDPOINT ---
exports.getAnalytics = async (req, res) => {
    try {
        const managerId = req.user.userId;

        // Parallel Fetch
        const [revenueTrends, byHotel, byStatus, hotelFinancialsRaw, settings] = await Promise.all([
            financeModel.getManagerRevenueTrends(managerId),
            financeModel.getManagerHotelsBreakdown(managerId),
            financeModel.getManagerBookingStatus(managerId),
            financeModel.getManagerFinancialTable(managerId),
            platformModel.getSettings() 
        ]);

        const globalRate = settings ? parseFloat(settings.commission_rate) : 0;

        let totalRevenue = 0;
        let totalCommission = 0;
        let totalBookings = 0;

        const hotelFinancials = hotelFinancialsRaw.map(h => {

            const rev = parseFloat(h.revenue || 0);
            // ✨ Use the live global rate
            const rate = parseFloat(h.commission_rate || globalRate); 
            const comm = rev * (rate / 100);
            
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

        res.json({
            success: true,
            data: {
                // Fix: Force Recharts values to be numbers, otherwise the graph breaks
                revenue: revenueTrends.map(r => ({ name: r.name, value: parseFloat(r.value || 0) })),
                byHotel: byHotel.map(h => ({ name: h.name, value: parseInt(h.value || 0, 10) })),
                byStatus: byStatus.map(s => ({ name: s.name, value: parseInt(s.value || 0, 10) })),
                summary: {
                    totalBookings,
                    totalRevenue,
                    totalCommission,
                    netIncome: totalRevenue - totalCommission
                },
                hotelFinancials
            }
        });

    } catch (err) {
        console.error("Manager Analytics Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getOverview = async (req, res) => {
    try {
        const managerId = req.user.userId;
        const data = await financeModel.getManagerOverviewStats(managerId);
        
        res.json({ success: true, data });
    } catch (err) {
        console.error("Overview Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};