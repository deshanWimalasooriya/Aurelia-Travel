const bookingModel = require('../models/bookingModel');
const roomModel = require('../models/roomModel');
const hotelModel = require('../models/hotelModel');
const platformModel = require('../models/platformModel');

// Import the helper
const { sendNotification } = require('./notificationController');

// 1. CREATE BOOKING (Consumer)
exports.createBooking = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;
        
        const { 
            room_id, check_in, check_out, 
            adults, children, payment_token, payment_provider, room_count,
            guest_first_name, guest_last_name, guest_email, guest_country, guest_phone, arrival_time, special_requests
        } = req.body;

        // A. Validation
        if (!room_id || !check_in || !check_out || !payment_token) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // B. Fetch Room & Calculate Price
        const room = await roomModel.getRoomById(room_id);
        if (!room) return res.status(404).json({ message: "Room not found" });

        // Calculate Nights
        const start = new Date(check_in);
        const end = new Date(check_out);
        const nights = (end - start) / (1000 * 60 * 60 * 24);

        if (nights < 1) return res.status(400).json({ message: "Invalid dates (Check-out must be after Check-in)" });

        // Financial Calculation
        const qty = room_count ? parseInt(room_count) : 1;
        const roomPrice = parseFloat(room.base_price_per_night) * nights * qty;
        
        const tax = 0; // Removed 10% Tax
        const service = 0; // Removed 5% Service Fee
        const totalPrice = roomPrice + tax + service;

        const settings = await platformModel.getSettings();
        const globalRate = settings && settings.commission_rate ? parseFloat(settings.commission_rate) : 5;
        const lockedCommission = totalPrice * (globalRate / 100);

        const requestedStatus = req.body.status === 'incomplete' ? 'pending' : (req.body.status || 'confirmed');
        
        // C. Construct Data
        const bookingData = {
            user_id: userId,
            hotel_id: room.hotel_id,
            room_id: room.id,
            room_count: qty,
            check_in,
            check_out,
            number_of_nights: nights,
            adults: adults || 1,
            children: children || 0,
            room_price: roomPrice,
            tax_amount: tax,
            service_charge: service,
            total_price: totalPrice,
            commission: lockedCommission,
            status: requestedStatus,
            payment_method: payment_provider || 'card',
            guest_first_name,
            guest_last_name,
            guest_email,
            guest_country,
            guest_phone,
            arrival_time,
            special_requests
        };

        const paymentData = {
            token_id: payment_token,
            provider: payment_provider || 'stripe'
        };

        // D. Execute Transaction (Now safely handles draft logic internally)
        const result = await bookingModel.createBooking(bookingData, paymentData);

        res.status(201).json({
            success: true,
            message: "Booking process initiated!",
            bookingId: result.bookingId,
            reference: result.reference
        });

        // 1. Notify User (WRAPPED IN AN IF STATEMENT)
        if (userId) {
            await sendNotification(
                userId,
                "Booking Status",
                `Your booking process for ${room.title || 'the hotel'} has started.`,
                "success",
                `/profile`
            );
        }

        // 2. Notify Hotel Manager (if exists)
        const hotel = await hotelModel.getById(room.hotel_id);
        if (hotel && hotel.manager_id) {
            await sendNotification(
                hotel.manager_id,
                "New Reservation",
                `You have a new booking request for ${room.title}.`,
                "info",
                "/admin/bookings"
            );
        }

    } catch (err) {
        // This will print the exact reason to your terminal if it fails again
        console.error("Booking Error:", err); 
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. GET MY BOOKINGS (Consumer)
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await bookingModel.getDetailedBookingsByUserId(req.user.userId);
        
        // Format for frontend
        const formatted = bookings.map(b => ({
            id: b.id,
            reference: b.booking_reference,
            checkIn: b.check_in,
            checkOut: b.check_out,
            totalPrice: b.total_price,
            status: b.status,
            hotel: { 
                id: b.hotel_id,  
                name: b.hotel_name, 
                image: b.hotel_image, 
                city: b.hotel_city 
            },
            room: { title: b.room_title, type: b.room_type }
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// 3. MANAGER DASHBOARD: Get Reservations
exports.getManagerBookings = async (req, res) => {
    try {
        const bookings = await bookingModel.getBookingsByManagerId(req.user.userId);
        res.json({ success: true, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. MANAGER ACTION: Check-In / Check-Out
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'checked_in', 'completed', 'cancelled'

        const booking = await bookingModel.getBookingById(id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Security Check
        const hotel = await hotelModel.getById(booking.hotel_id);
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const updated = await bookingModel.updateStatus(id, status);
        res.json({ success: true, message: `Status updated to ${status}`, data: updated });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 5. GENERIC / ADMIN
exports.getAllBookings = async (req, res) => {
    try { const bookings = await bookingModel.getAllBookings(); res.json(bookings); }
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getBookingById = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.userId; // Extracted from the JWT token

        const booking = await bookingModel.getBookingById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // SECURITY FIX: Check if the logged-in user owns this booking
        // OR if the user is an admin (assuming you have an 'admin' role check)
        if (booking.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: You do not own this booking' });
        }

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching booking' });
    }
};

exports.deleteBooking = async (req, res) => {
    try { await bookingModel.deleteBooking(req.params.id); res.json({ message: "Deleted" }); }
    catch (err) { res.status(500).json({ error: err.message }); }
};

// Preserved for compatibility if needed
exports.getBookingsByHotelId = async (req, res) => {
    try { const bookings = await bookingModel.getBookingsByHotelId(req.params.hotelId); res.json(bookings); }
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.confirmGuestBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await bookingModel.getBookingById(id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        const updated = await bookingModel.updateStatus(id, 'completed');
        res.json({ success: true, message: "Guest Booking confirmed!", data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.confirmUserBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await bookingModel.getBookingById(id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.user_id !== req.user.userId) return res.status(403).json({ message: "Access denied" });
        const updated = await bookingModel.updateStatus(id, 'completed');
        res.json({ success: true, message: "Booking confirmed!", data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 🚨 NEW: Payment Success & Inventory Deduction Handler
// Call this endpoint from your frontend when the user successfully pays
exports.handlePaymentSuccess = async (req, res) => {
    const { bookingId } = req.body; 

    try {
        if (!bookingId) {
            return res.status(400).json({ success: false, message: "Booking ID is required" });
        }

        // Call the model function that securely updates status AND decrements inventory
        await bookingModel.confirmBookingPayment(bookingId);
        
        return res.status(200).json({ 
            success: true, 
            message: "Payment successful. Inventory updated and booking confirmed." 
        });

    } catch (error) {
        console.error("Payment confirmation error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error confirming booking: " + error.message 
        });
    }
};