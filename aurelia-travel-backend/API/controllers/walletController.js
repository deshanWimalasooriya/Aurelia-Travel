const paymentModel = require('../models/paymentMethodModel');

// 1. ADD METHOD
exports.addMethod = async (req, res) => {
    try {
        const { provider, token_id, card_last4, card_brand } = req.body;

        // ✅ FIX 1: Input Validation (Prevent Bad Data)
        if (!token_id || !card_last4) {
            return res.status(400).json({ 
                success: false, 
                message: 'Token ID and Card Last 4 digits are required' 
            });
        }

        // ✅ FIX 2: Prevent Duplicate Cards (Optional but Recommended)
        // Check if this card token already exists for this user to avoid clutter
        // (Removed findOne because it's not implemented and we generate unique tokens currently)

        const userId = req.user.id || req.user.userId;

        const newMethod = await paymentModel.create({
            user_id: userId,
            provider: provider || 'stripe',
            payment_method_id: token_id,
            card_last_four: card_last4, // Store ONLY last 4 (PCI Compliance)
            card_brand: card_brand || 'visa',
            is_active: true
        });

        res.status(201).json({ success: true, data: newMethod });

    } catch (err) {
        console.error("Add Card Error:", err); // Log internal error
        res.status(500).json({ success: false, message: "Failed to add card" });
    }
};

// 2. GET WALLET (Payment Methods)
exports.getMyWallet = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const wallet = await paymentModel.findAllByUserId(userId);
        
        // Always return an array, even if empty (easier for Frontend)
        res.json({ success: true, data: wallet || [] });
        
    } catch (err) {
        console.error("Get Wallet Error:", err);
        res.status(500).json({ success: false, message: "Could not retrieve wallet", error: err.message, stack: err.stack });
    }
};

// 3. REMOVE METHOD
exports.removeMethod = async (req, res) => {
    try {
        const methodId = req.params.id;
        const userId = req.user.id || req.user.userId;

        if (!methodId) {
            return res.status(400).json({ success: false, message: "Card ID required" });
        }

        // ✅ FIX 4: Explicit Ownership Check
        // Ensure the card actually belongs to the user requesting deletion.
        // Even if your model handles it, double-checking here is safer.
        const card = await paymentModel.findById(methodId);
        
        if (!card) {
            return res.status(404).json({ success: false, message: "Card not found" });
        }

        if (card.user_id !== userId) {
            // Critical: Don't let User A delete User B's card
            return res.status(403).json({ success: false, message: "Unauthorized action" });
        }

        await paymentModel.remove(methodId); // Now safe to delete
        
        res.json({ success: true, message: "Card removed successfully" });

    } catch (err) {
        console.error("Remove Card Error:", err);
        res.status(500).json({ success: false, message: "Failed to remove card" });
    }
};