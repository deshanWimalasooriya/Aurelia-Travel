const financeModel = require('../models/financeModel');

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

// --- NEW ANALYTICS ENDPOINT ---
exports.getAnalytics = async (req, res) => {
    try {
        const managerId = req.user.userId;

        // Parallel Fetch
        const [revenueTrends, byHotel, byStatus, hotelFinancialsRaw] = await Promise.all([
            financeModel.getManagerRevenueTrends(managerId),
            financeModel.getManagerHotelsBreakdown(managerId),
            financeModel.getManagerBookingStatus(managerId),
            financeModel.getManagerFinancialTable(managerId)
        ]);

        // Calculate Summary
        let totalRevenue = 0;
        let totalCommission = 0;
        let totalBookings = 0;

        const hotelFinancials = hotelFinancialsRaw.map(h => {
            const rev = parseFloat(h.revenue || 0);
            const rate = parseFloat(h.commission_rate || 5.00);
            const comm = rev * (rate / 100);
            
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

        res.json({
            revenue: revenueTrends,
            byHotel: byHotel,
            byStatus: byStatus,
            summary: {
                totalBookings,
                totalRevenue,
                totalCommission,
                netIncome: totalRevenue - totalCommission
            },
            hotelFinancials
        });

    } catch (err) {
        console.error("Manager Analytics Error:", err);
        res.status(500).json({ error: err.message });
    }
};