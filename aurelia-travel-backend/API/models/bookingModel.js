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


// In API/models/bookingModel.js

// ... existing code ...

// ✅ NEW: Get Bookings for a Specific Hotel (Detailed)
exports.getBookingsByHotelId = (hotelId) => {
  return knex('bookings')
    .join('users', 'bookings.user_id', 'users.id')
    .join('hotels', 'bookings.hotel_id', 'hotels.id')
    .join('rooms', 'bookings.room_id', 'rooms.id')
    .select(
      'bookings.*',
      'users.username',
      'users.email',
      'users.profile_image',
      'hotels.name as hotel_name',
      'rooms.title as room_title'
    )
    .where('bookings.hotel_id', hotelId)
    .orderBy('bookings.check_in', 'desc');
};

// ✅ NEW: Get All Bookings for a Manager (Detailed)
exports.getBookingsByManagerId = (managerId) => {
  return knex('bookings')
    .join('users', 'bookings.user_id', 'users.id')
    .join('hotels', 'bookings.hotel_id', 'hotels.id')
    .join('rooms', 'bookings.room_id', 'rooms.id')
    .select(
      'bookings.*',
      'users.username',
      'users.email',
      'users.profile_image',
      'hotels.name as hotel_name',
      'rooms.title as room_title'
    )
    .where('hotels.manager_id', managerId) // Filter by Manager ID
    .orderBy('bookings.check_in', 'desc');
};

// ... existing code ...

// ✅ NEW: Analytics - Monthly Revenue (Last 6 Months)
exports.getMonthlyRevenue = (managerId) => {
  return knex('bookings')
    .join('hotels', 'bookings.hotel_id', 'hotels.id')
    .select(knex.raw("DATE_FORMAT(check_in, '%Y-%m') as name")) // Group by Month
    .sum('total_price as value')
    .where('bookings.status', 'confirmed')
    .andWhere('hotels.manager_id', managerId)
    .groupByRaw("DATE_FORMAT(check_in, '%Y-%m')")
    .orderBy('name', 'asc')
    .limit(6);
};

// ✅ NEW: Analytics - Bookings per Hotel (Pie Chart Data)
exports.getBookingsPerHotel = (managerId) => {
  return knex('bookings')
    .join('hotels', 'bookings.hotel_id', 'hotels.id')
    .select('hotels.name')
    .count('bookings.id as value')
    .where('hotels.manager_id', managerId)
    .groupBy('hotels.name');
};

// ✅ NEW: Analytics - Booking Status Distribution (Donut Chart)
exports.getBookingStatusStats = (managerId) => {
  return knex('bookings')
    .join('hotels', 'bookings.hotel_id', 'hotels.id')
    .select('bookings.status as name')
    .count('bookings.id as value')
    .where('hotels.manager_id', managerId)
    .groupBy('bookings.status');
};