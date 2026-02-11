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