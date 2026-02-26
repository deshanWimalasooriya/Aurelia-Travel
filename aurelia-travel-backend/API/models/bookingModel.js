const knex = require('../../config/db');

// Helper: Generate unique reference (e.g., "BKG-8X92")
const generateReference = () => {
    return 'BKG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// 1. CREATE BOOKING (High Concurrency - Optimistic Locking)
exports.createBooking = async (bookingData, paymentData) => {
    return await knex.transaction(async (trx) => {
        
        // STEP A: Fetch Availability (Fast, non-blocking read - NO .forUpdate()!)
        const checkAvailability = await trx('room_availability')
            .where('room_id', bookingData.room_id)
            .whereBetween('date', [bookingData.check_in, bookingData.check_out])
            .orderBy('date', 'asc'); 

        // Validation 1: Prevent "Ghost" Bookings
        if (checkAvailability.length === 0) {
            throw new Error('Room configuration not found for these dates.');
        }

        // Validation 2: Check for sold out days
        const soldOutDays = checkAvailability.filter(day => day.available_quantity < 1);
        if (soldOutDays.length > 0) {
            throw new Error('Room is no longer available for these dates.');
        }

        // STEP B: The Industry Standard - Atomic Optimistic Locking
        // Instead of locking the DB, we attempt an atomic decrement.
        for (const day of checkAvailability) {
            const updatedRows = await trx('room_availability')
                .where('id', day.id)
                .where('available_quantity', '>=', 1) // ✅ OPTIMISTIC LOCK: Only update if still available!
                .decrement('available_quantity', 1);

            if (updatedRows === 0) {
                // If 0 rows were updated, someone else snatched the room in the last 2 milliseconds!
                // The transaction automatically rolls back and releases any previous days.
                throw new Error(`Someone just booked this room for ${new Date(day.date).toLocaleDateString()}. Please try different dates.`);
            }
        }

        // STEP C: Insert Booking
        const reference = typeof generateReference === 'function' 
            ? generateReference() 
            : `BK-${Date.now()}`;

        const isPaid = !!paymentData; 

        const [bookingId] = await trx('bookings').insert({
            ...bookingData,
            booking_reference: reference,
            status: isPaid ? 'confirmed' : 'pending_payment', 
            payment_status: isPaid ? 'paid' : 'unpaid'
        });

        // STEP D: Record Payment Transaction (Only if payment exists)
        if (isPaid) {
            await trx('payment_transactions').insert({
                booking_id: bookingId,
                user_id: bookingData.user_id,
                transaction_id: paymentData.token_id, 
                payment_provider: paymentData.provider,
                amount: bookingData.total_price,
                status: 'succeeded',
                transaction_type: 'payment',
                created_at: new Date()
            });
        }

        return { bookingId, reference, status: isPaid ? 'confirmed' : 'pending_payment' };
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