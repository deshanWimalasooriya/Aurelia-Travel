const reviewModel = require('../models/reviewModel');
const hotelModel = require('../models/hotelModel'); // Import hotel model
const { sendNotification } = require('./notificationController'); // Import helper

exports.addReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { hotel_id, booking_id, rating, comment, title } = req.body;

        if (!booking_id || !rating) return res.status(400).json({ message: "Rating and Booking ID required" });

        // Security Check
        const canReview = await reviewModel.canUserReview(userId, booking_id);
        if (!canReview) {
            return res.status(403).json({ message: "You can only review completed stays." });
        }

        const reviewData = {
            user_id: userId,
            hotel_id,
            booking_id,
            rating,
            comment,
            title,
            is_approved: true // Auto-approve for now
        };

        // --- NEW TRIGGER CODE ---
        const hotel = await hotelModel.getById(hotel_id);
        if (hotel && hotel.manager_id) {
            await sendNotification(
                hotel.manager_id,
                "New Guest Review",
                `You received a ${rating}-star review.`,
                "info",
                "/admin/reviews"
            );
        }
        // ------------------------

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