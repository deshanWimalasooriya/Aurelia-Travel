const knex = require('../../config/knex');

// Get all bookings
exports.getAllBookings = async () => await knex('bookings').select('*');

exports.getBookingById = (id) => knex('bookings').where({ id }).first();

exports.createBooking = async (booking) => {
  const [newBooking] = await knex('bookings')
    .insert(booking)
    .returning('*');
  return newBooking;
};

exports.updateBooking = (id, booking) => knex('bookings').where({ id }).update(booking);

exports.deleteBooking = (id) => knex('bookings').where({ id }).del();

exports.getBookingsByUserId = (userId) => knex('bookings').where({ user_id: userId });

exports.getRecentBookings = (limit = 5) => 
  knex('bookings')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit);

exports.findById = async (id) => {
  return await knex('bookings').select('*').where({ id }).first();
};