// models/hotel.js
const knex = require('../../config/knex');

// Get all hotels with optional filters
exports.getAll = () => {
  return knex('hotels').select('*');
};

// Get hotel by ID
exports.getById = (id) => {
  return knex('hotels').where({ id }).first();
};

// Create new hotel
exports.create = (hotelData) => {
  return knex('hotels').insert(hotelData).returning('*');
};

// Update hotel
exports.update = (id, hotelData) => {
  return knex('hotels')
    .where({ id })
    .update(hotelData)
    .returning('*');
};

// Delete hotel
exports.delete = (id) => {
  return knex('hotels').where({ id }).del();
};

// Get TOP 4 RATED hotels (highest rating, then price)
exports.TopRated = (limit = 4) => 
  knex('hotels')
    .select('*')
    .orderBy('rating', 'desc')
    .limit(limit);

// Get NEWEST 4 hotels (most recent created_at)
exports.getNewest = (limit = 4) => 
  knex('hotels')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit);