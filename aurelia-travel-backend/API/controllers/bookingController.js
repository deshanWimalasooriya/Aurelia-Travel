const bookingModel = require('../models/bookingModel');
const roomModel = require('../models/roomModel'); // Need this to find hotel_id

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
        const { room_id, check_in, check_out, adults, children, total_price } = req.body;

        // 1. Fetch Room to get the correct Hotel ID
        const room = await roomModel.findById(room_id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // 2. Construct Data
        const bookingData = {
            user_id: userId,
            room_id: room_id,
            hotel_id: room.hotel_id, // Auto-link hotel
            check_in,
            check_out,
            adults: adults || 1,
            children: children || 0,
            total_price,
            status: 'confirmed' // Default status
        };

        // 3. Insert
        const newBooking = await bookingModel.createBooking(bookingData);
        res.status(201).json(newBooking);
    } catch (err) {
        console.error("Booking Error:", err);
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

// Admin use mostly
exports.getBookingsByUserId = async (req, res) => {
    try {
        const bookings = await bookingModel.getBookingsByUserId(req.params.userId);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Client Profile use
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        
        // Fetch detailed data (with joined Hotel/Room names)
        const rawBookings = await bookingModel.getDetailedBookingsByUserId(userId);

        // Transform flat SQL result into Nested JSON for Frontend
        // Frontend expects: booking.hotel.name, booking.room.title
        const formattedBookings = rawBookings.map(b => ({
            id: b.id,
            checkIn: b.check_in,
            checkOut: b.check_out,
            totalPrice: b.total_price,
            status: b.status,
            adults: b.adults,
            hotel: {
                id: b.hotel_id,
                name: b.hotel_name,
                image: b.hotel_image,
                city: b.hotel_city
            },
            room: {
                id: b.room_id,
                title: b.room_title,
                type: b.room_type
            }
        }));

        res.json(formattedBookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};