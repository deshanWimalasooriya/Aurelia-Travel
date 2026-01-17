const knex = require('../../config/knex');

// Helper: Generate unique reference (e.g., "BKG-8X92")
const generateReference = () => {
    return 'BKG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// 1. CREATE BOOKING (The Critical Transaction)
// ✅ Updated: Locks inventory rows to prevent double-booking
exports.createBooking = async (bookingData, paymentData) => {
    return await knex.transaction(async (trx) => {
        
        // STEP A: Double-Check Availability (Locking)
        // We query the inventory for the specific room and dates.
        // .forUpdate() locks these rows so no one else can book them simultaneously.
        const unavailableDays = await trx('room_availability')
            .where('room_id', bookingData.room_id)
            .whereBetween('date', [bookingData.check_in, bookingData.check_out])
            .andWhere('available_quantity', '<', 1) // If 0 left, it's taken
            .forUpdate();

        if (unavailableDays.length > 0) {
            throw new Error('Room is no longer available for these dates.');
        }

        // STEP B: Decrement Inventory
        // Reduce 'available_quantity' by 1 for every day of the stay
        await trx('room_availability')
            .where('room_id', bookingData.room_id)
            .whereBetween('date', [bookingData.check_in, bookingData.check_out])
            .decrement('available_quantity', 1);

        // STEP C: Insert Booking
        const reference = generateReference();
        const [bookingId] = await trx('bookings').insert({
            ...bookingData,
            booking_reference: reference,
            status: 'confirmed', // Assuming payment succeeds immediately
            payment_status: 'paid'
        });

        // STEP D: Record Payment Transaction
        if (paymentData) {
            await trx('payment_transactions').insert({
                booking_id: bookingId,
                user_id: bookingData.user_id,
                transaction_id: paymentData.token_id, // Stripe/PayPal ID
                payment_provider: paymentData.provider,
                amount: bookingData.total_price,
                status: 'succeeded',
                transaction_type: 'payment'
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