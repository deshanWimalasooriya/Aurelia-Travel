const bookingModel = require('../models/bookingModel');

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await bookingModel.getAllBookings();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const booking = await bookingModel.getBookingById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // Automatically assign the logged-in user's ID to the booking
        const bookingData = { ...req.body, user_id: userId };

        // Note: Ensure req.body contains room_id, check_in, check_out, total_price
        const newBooking = await bookingModel.createBooking(bookingData);
        res.status(201).json(newBooking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const updated = await bookingModel.updateBooking(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Booking updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const deleted = await bookingModel.deleteBooking(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Booking deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBookingsByUserId = async (req, res) => {
    try {
        const bookings = await bookingModel.getBookingsByUserId(req.params.userId);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const bookings = await bookingModel.getBookingsByUserId(userId);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};