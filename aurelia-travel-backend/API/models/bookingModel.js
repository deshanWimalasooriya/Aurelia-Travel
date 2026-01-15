const knex = require('../../config/knex');

// Get all bookings (Standard)
exports.getAllBookings = async () => await knex('bookings').select('*');

exports.getBookingById = (id) => knex('bookings').where({ id }).first();

// Create Booking (MySQL Fixed)
exports.createBooking = async (bookingData) => {
  const [id] = await knex('bookings').insert(bookingData);
  return knex('bookings').where({ id }).first();
};

exports.updateBooking = (id, booking) => knex('bookings').where({ id }).update(booking);

exports.deleteBooking = (id) => knex('bookings').where({ id }).del();

// Basic fetch (just IDs)
exports.getBookingsByUserId = (userId) => knex('bookings').where({ user_id: userId });

// --- NEW: Detailed Fetch for Profile Page ---
// Joins Hotel and Room data so the frontend can show names/titles
exports.getDetailedBookingsByUserId = (userId) => {
  return knex('bookings')
    .join('hotels', 'bookings.hotel_id', 'hotels.id')
    .join('rooms', 'bookings.room_id', 'rooms.id')
    .select(
      'bookings.*',
      'hotels.name as hotel_name',
      'hotels.image_url as hotel_image',
      'hotels.city as hotel_city',
      'rooms.title as room_title',
      'rooms.room_type as room_type'
    )
    .where('bookings.user_id', userId)
    .orderBy('bookings.check_in', 'desc');
};

exports.getRecentBookings = (limit = 5) => 
  knex('bookings')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit);