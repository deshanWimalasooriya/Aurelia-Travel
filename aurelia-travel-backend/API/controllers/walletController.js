const paymentModel = require('../models/paymentMethodModel');

exports.addMethod = async (req, res) => {
    try {
        const { provider, token_id, card_last4, card_brand } = req.body;
        // In real app: Verify token with Stripe here
        const newMethod = await paymentModel.create({
            user_id: req.user.userId,
            provider: provider || 'stripe',
            payment_method_id: token_id,
            card_last_four: card_last4,
            card_brand: card_brand || 'visa',
            is_active: true
        });
        res.status(201).json({ success: true, data: newMethod });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMyWallet = async (req, res) => {
    try {
        const wallet = await paymentModel.findAllByUserId(req.user.userId);
        res.json({ success: true, data: wallet });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeMethod = async (req, res) => {
    try {
        await paymentModel.remove(req.params.id, req.user.userId);
        res.json({ success: true, message: "Card removed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};