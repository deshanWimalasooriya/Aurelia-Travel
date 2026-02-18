const reviewModel = require('../models/reviewModel');
const hotelModel = require('../models/hotelModel'); 
const { sendNotification } = require('./notificationController'); 

exports.addReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { hotel_id, booking_id, rating, comment, title } = req.body;

        if (!booking_id || !rating) return res.status(400).json({ message: "Rating and Booking ID required" });

        // 1. Security Check
        const canReview = await reviewModel.canUserReview(userId, booking_id);
        if (!canReview) {
            return res.status(403).json({ message: "You can only review valid completed stays." });
        }

        // 2. Duplicate Check
        const hasReviewed = await reviewModel.hasReview(userId, booking_id);
        if (hasReviewed) {
            return res.status(409).json({ message: "You have already reviewed this stay." });
        }

        const reviewData = {
            user_id: userId,
            hotel_id,
            booking_id,
            rating,
            comment,
            title,
            is_approved: true
        };

        // 3. Notify Manager
        const hotel = await hotelModel.getById(hotel_id);
        if (hotel && hotel.manager_id) {
            await sendNotification(
                hotel.manager_id,
                "New Guest Review",
                `Received ${rating}-star review for ${hotel.name}.`,
                "info",
                "/admin/reviews"
            );
        }

        await reviewModel.create(reviewData);
        res.status(201).json({ success: true, message: "Review posted successfully" });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getHotelReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.findByHotelId(req.params.hotelId);
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ✅ NEW: Manager Get Reviews
exports.getManagerReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.findByManagerId(req.user.userId);
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ✅ NEW: Manager Reply
exports.replyToReview = async (req, res) => {
    try {
        const { id } = req.params; // Review ID
        const { reply } = req.body;

        await reviewModel.addReply(id, reply);
        res.json({ success: true, message: "Reply posted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};