const knex = require('../../config/db');

// Helper: Generate unique reference (e.g., "BKG-8X92")
const generateReference = () => {
    return 'BKG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// 1. CREATE BOOKING (The Critical Transaction)
// ✅ Updated: Locks inventory rows to prevent double-booking
// E:\Travelling\aurelia-travel-backend\API\models\bookingModel.js

exports.createBooking = async (bookingData, paymentData) => {
    return await knex.transaction(async (trx) => {
        
        // 1. Safely Format Dates to YYYY-MM-DD for MySQL
        const checkInDate = new Date(bookingData.check_in);
        const formattedCheckIn = checkInDate.toISOString().split('T')[0];
        
        // 2. Calculate the exact last night of the stay
        // We subtract 1 day from check-out because guests don't consume inventory on the day they leave
        const lastNight = new Date(bookingData.check_out);
        lastNight.setDate(lastNight.getDate() - 1);
        const formattedLastNight = lastNight.toISOString().split('T')[0];

        // 3. Check Availability using strictly formatted dates
        const checkAvailability = await trx('room_availability')
            .where('room_id', bookingData.room_id)
            .whereBetween('date', [formattedCheckIn, formattedLastNight])
            .orderBy('date', 'asc')
            .forUpdate();

        // 4. Validate Room Configuration Exists
        if (checkAvailability.length === 0) {
            throw new Error('Room configuration not found for these dates.');
        }

        // 5. Validate Rooms are not Sold Out
        const soldOutDays = checkAvailability.filter(day => day.available_quantity < 1);
        if (soldOutDays.length > 0) {
            throw new Error('Room is no longer available for these dates.');
        }

        // 6. Decrement Inventory safely
        await trx('room_availability')
            .where('room_id', bookingData.room_id)
            .whereBetween('date', [formattedCheckIn, formattedLastNight])
            .decrement('available_quantity', 1);

        // 7. Generate Booking Reference
        const reference = typeof generateReference === 'function' 
            ? generateReference() 
            : `BK-${Date.now()}`;
            
        const isPaid = !!paymentData; 

        // 8. Insert Booking Record (Using original bookingData for accurate check-out records)
        const [bookingId] = await trx('bookings').insert({
            ...bookingData,
            booking_reference: reference,
            status: isPaid ? 'confirmed' : 'pending_payment', 
            payment_status: isPaid ? 'paid' : 'unpaid'
        });

        // 9. Record Payment (If applicable)
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