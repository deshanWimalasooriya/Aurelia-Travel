const knex = require('../../config/db');

// Helper: Generate unique reference (e.g., "BKG-8X92")
const generateReference = () => {
    return 'BKG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// 1. CREATE BOOKING (The Critical Transaction)
// ✅ Updated: Locks inventory rows to prevent double-booking
exports.createBooking = async (bookingData, paymentData) => {
    return await knex.transaction(async (trx) => {
        
        // STEP A: Double-Check Availability (CRITICAL FIXES APPLIED)
        // 1. We query ALL days in the range (not just sold out ones) to lock the rows.
        // 2. We add .orderBy('date', 'asc') to prevent Deadlocks.
        const checkAvailability = await trx('room_availability')
            .where('room_id', bookingData.room_id)
            .whereBetween('date', [bookingData.check_in, bookingData.check_out])
            .orderBy('date', 'asc') // ✅ FIX 1: Prevent Deadlock by forcing lock order
            .forUpdate();           // ✅ Locks these rows

        // Logic Check: Filter in JS to see if any locked day is actually full
        // This prevents the "Race Condition" where 2 users see "1 room left" and both book it.
        const soldOutDays = checkAvailability.filter(day => day.available_quantity < 1);

        if (soldOutDays.length > 0) {
            throw new Error('Room is no longer available for these dates.');
        }

        // STEP B: Decrement Inventory
        // Since we locked the rows in Step A, this is now 100% safe.
        await trx('room_availability')
            .where('room_id', bookingData.room_id)
            .whereBetween('date', [bookingData.check_in, bookingData.check_out])
            .decrement('available_quantity', 1);

        // STEP C: Insert Booking
        // Assuming generateReference() is imported/available in this file
        const reference = typeof generateReference === 'function' 
            ? generateReference() 
            : `BK-${Date.now()}`; // Fallback if function missing

        const [bookingId] = await trx('bookings').insert({
            ...bookingData,
            booking_reference: reference,
            status: 'confirmed', 
            payment_status: 'paid'
        });

        // STEP D: Record Payment Transaction
        if (paymentData) {
            await trx('payment_transactions').insert({
                booking_id: bookingId,
                user_id: bookingData.user_id,
                transaction_id: paymentData.token_id, 
                payment_provider: paymentData.provider,
                amount: bookingData.total_price,
                status: 'succeeded',
                transaction_type: 'payment',
                created_at: new Date() // Good practice to ensure timestamp
            });
        }

        return { bookingId, reference };
    });
};

// 2. GET MY BOOKINGS (User Dashboard - Detailed)
exports.getDetailedBookingsByUserId = (userId) => {
    return knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .join('rooms', 'bookings.room_id', 'rooms.id')
        .select(
            'bookings.*',
            'hotels.name as hotel_name',
            'hotels.main_image as hotel_image', 
            'hotels.city as hotel_city',
            'rooms.title as room_title',
            'rooms.room_type'
        )
        .where('bookings.user_id', userId)
        .orderBy('bookings.check_in', 'desc');
};

// 3. GET MANAGER BOOKINGS (Dashboard)
exports.getBookingsByManagerId = (managerId) => {
    return knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .join('rooms', 'bookings.room_id', 'rooms.id')
        .join('users', 'bookings.user_id', 'users.id') // Guest Info
        .select(
            'bookings.*',
            'hotels.name as hotel_name',
            'rooms.title as room_title',
            'users.username as guest_name',
            'users.email as guest_email',
            'users.profile_image as guest_image'
        )
        .where('hotels.manager_id', managerId)
        .orderBy('bookings.check_in', 'asc');
};

// 4. GET SINGLE BOOKING (Detailed)
exports.getBookingById = (id) => {
    return knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .join('rooms', 'bookings.room_id', 'rooms.id')
        .select(
            'bookings.*',
            'hotels.name as hotel_name',
            'rooms.title as room_title',
            'hotels.manager_id' // Needed for permission check
        )
        .where('bookings.id', id)
        .first();
};

// 5. UPDATE STATUS
exports.updateStatus = async (id, status) => {
    await knex('bookings').where({ id }).update({ status });
    return exports.getBookingById(id);
};

// 6. ADMIN & HELPERS
exports.getAllBookings = () => knex('bookings').select('*');
exports.deleteBooking = (id) => knex('bookings').where({ id }).del();
exports.getBookingsByHotelId = (hotelId) => knex('bookings').where({ hotel_id: hotelId });