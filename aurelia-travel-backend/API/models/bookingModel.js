const knex = require('../../config/db');

// Helper: Generate unique reference (e.g., "BKG-8X92")
const generateReference = () => {
    return 'BKG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// 1. CREATE BOOKING (High Concurrency - Optimistic Locking)
exports.createBooking = async (bookingData, paymentData) => {
    return await knex.transaction(async (trx) => {
        
        // Define how many rooms the guest actually wants (default to 1)
        const requestedQty = bookingData.room_count || 1;
        
        // STEP A: Fetch Availability (Fast, non-blocking read)
        const checkAvailability = await trx('room_availability')
            .where('room_id', bookingData.room_id)
            .where('date', '>=', bookingData.check_in)    // ✅ Include check-in date
            .where('date', '<', bookingData.check_out)    // ✅ Exclude check-out date
            .orderBy('date', 'asc'); 

        // Validation 1: Prevent "Ghost" Bookings
        if (checkAvailability.length === 0) {
            throw new Error('Room configuration not found for these dates.');
        }

        // Validation 2: Check for sold out days dynamically
        const soldOutDays = checkAvailability.filter(day => day.available_quantity < requestedQty);
        if (soldOutDays.length > 0) {
            throw new Error('Room is no longer available for these dates.');
        }

        // STEP B: The Industry Standard - Atomic Optimistic Locking
        for (const day of checkAvailability) {
            const updatedRows = await trx('room_availability')
                .where('id', day.id)
                .where('available_quantity', '>=', requestedQty) // ✅ Check against requested quantity
                .decrement('available_quantity', requestedQty);  // ✅ Deduct requested quantity

            if (updatedRows === 0) {
                throw new Error(`Someone just booked this room for ${new Date(day.date).toLocaleDateString()}. Please try different dates.`);
            }
        }

        // STEP C: Insert Booking
        const reference = typeof generateReference === 'function' 
             ? generateReference() 
             : `BK-${Date.now()}`;
             
        const isPayOnArrival = bookingData.payment_method === 'arrival';
        const isPaid = !isPayOnArrival && !!paymentData;

        // 🚨 NEW: Extract room_count so it doesn't go into the insert query
        const { room_count, ...dataForDatabase } = bookingData;

        const [bookingId] = await trx('bookings').insert({
            ...dataForDatabase, // Use the separated data here
            booking_reference: reference,
            status: bookingData.status || 'pending', 
            payment_status: isPayOnArrival ? 'pending' : 'paid'
        });

        // STEP D: Record Payment Transaction 
        if (isPaid) {
            await trx('payment_transactions').insert({
                booking_id: bookingId,
                user_id: bookingData.user_id || null, 
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

// Inside bookingModel.js

exports.confirmBookingPayment = async (bookingId) => {
    // We use a transaction so if the inventory update fails, the status update rolls back safely.
    return connection.transaction(async (trx) => {
        
        // 1. Fetch the draft booking to get the room_id and check its status
        const booking = await trx('bookings').where('id', bookingId).first();
        
        if (!booking) {
            throw new Error('Booking not found');
        }
        
        // Prevent double-decrementing if the webhook hits twice
        if (booking.status === 'confirmed') {
            return { message: 'Booking already confirmed', bookingId };
        }

        // 2. Update the booking status to confirmed & paid
        await trx('bookings')
            .where('id', bookingId)
            .update({
                status: 'confirmed',
                payment_status: 'paid',
                updated_at: connection.fn.now()
            });

        // 3. NOW we decrement the inventory safely, because payment is complete
        // (Assuming a standard 1 room per booking. If users can book multiple rooms, replace '1' with booking.quantity)
        await trx('rooms')
            .where('id', booking.room_id)
            .decrement('available_quantity', 1); 

        return { success: true, bookingId };
    });
};
