// models/hotelModel.js
const knex = require('../../config/knex');

// Helper to include the "Starting Price" from the rooms table
const withMinPrice = (query) => {
  return query.select(
    'hotels.*',
    knex.raw('(SELECT MIN(price_per_night) FROM rooms WHERE rooms.hotel_id = hotels.id) as price')
  );
};

// Get all hotels
exports.getAll = () => {
  return withMinPrice(knex('hotels'));
};

// Get hotel by ID
exports.getById = (id) => {
  return withMinPrice(knex('hotels').where('hotels.id', id)).first();
};

// Create new hotel
exports.create = async (hotelData) => {
  // MySQL doesn't support .returning('*') for insert in older versions, 
  // but Knex handles it by returning [id].
  const [id] = await knex('hotels').insert(hotelData);
  return exports.getById(id);
};

// Update hotel
exports.update = async (id, hotelData) => {
  await knex('hotels').where({ id }).update(hotelData);
  return exports.getById(id);
};

// Delete hotel
exports.delete = (id) => {
  return knex('hotels').where({ id }).del();
};

// Top Rated (using new rating_average column)
exports.TopRated = (limit = 4) => 
  withMinPrice(knex('hotels'))
    .orderBy('rating_average', 'desc')
    .limit(limit);

// Newest
exports.getNewest = (limit = 4) => 
  withMinPrice(knex('hotels'))
    .orderBy('created_at', 'desc')
    .limit(limit);

