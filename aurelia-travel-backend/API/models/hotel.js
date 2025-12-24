// models/hotel.js
const knex = require('../../config/knex');

// Get all hotels with optional filters
exports.getAll = (filters = {}) => {
  let query = knex('hotels').select('*');
  
  // Filter by location (partial match)
  if (filters.location) {
    query = query.where('location', 'ilike', `%${filters.location}%`);
  }
  
  // Filter by price range
  if (filters.minPrice) {
    query = query.where('price', '>=', parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    query = query.where('price', '<=', parseFloat(filters.maxPrice));
  }
  
  // Filter by rating
  if (filters.rating) {
    query = query.where('rating', '>=', parseInt(filters.rating));
  }
  
  // Filter by amenities (multiple)
  if (filters.amenities) {
    const amenitiesArray = filters.amenities.split(',');
    query = query.where((builder) => {
      amenitiesArray.forEach(amenity => {
        builder.orWhere('amenities', 'ilike', `%${amenity.trim()}%`);
      });
    });
  }
  
  return query.orderBy('price', 'asc');
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
