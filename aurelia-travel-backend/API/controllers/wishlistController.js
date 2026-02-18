const wishlistModel = require('../models/wishlistModel');

exports.getWishlist = async (req, res) => {
    try {
        const items = await wishlistModel.getUserWishlist(req.user.userId);
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleWishlist = async (req, res) => {
    try {
        const { hotelId } = req.body;
        const userId = req.user.userId;

        // Check if exists
        const currentList = await wishlistModel.getUserWishlist(userId);
        const exists = currentList.find(item => item.id === parseInt(hotelId));

        if (exists) {
            await wishlistModel.removeFromWishlist(userId, hotelId);
            res.json({ success: true, action: 'removed', message: 'Removed from wishlist' });
        } else {
            await wishlistModel.addToWishlist(userId, hotelId);
            res.json({ success: true, action: 'added', message: 'Added to wishlist' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeItem = async (req, res) => {
    try {
        await wishlistModel.removeFromWishlist(req.user.userId, req.params.hotelId);
        res.json({ success: true, message: 'Item removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.clearAll = async (req, res) => {
    try {
        await wishlistModel.clearWishlist(req.user.userId);
        res.json({ success: true, message: 'Wishlist cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};