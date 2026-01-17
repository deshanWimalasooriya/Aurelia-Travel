const knex = require('../../config/knex')

//Get all users
exports.getAllUsers = async () => await knex('users').select('*');
exports.getUserById = (id) => knex('users').where({ id }).first();
exports.getUserByEmail = (email) => knex('users').where({ email }).first();
exports.createUser = async (user) => {
  const [newUser] = await knex('users')
    .insert(user)
    .returning(['id', 'username', 'email', 'role', 'created_at', 'updated_at']);
  return newUser;
};
exports.updateUser = (id, user) => knex('users').where({ id }).update(user);
exports.deleteUser = (id) => knex('users').where({ id }).del();

// Backend/models/userModel.js

exports.findById = async (id) => {
  return await knex('users')
    .select('*')
    .where({ id })
    .first();
};

// ✅ NEW: Get Customers for a specific Manager (CRM Logic)
exports.getCustomersByManagerId = (managerId) => {
  return knex('users')
    .join('bookings', 'users.id', 'bookings.user_id')
    .join('hotels', 'bookings.hotel_id', 'hotels.id')
    .select(
      'users.id',
      'users.username',
      'users.email',
      'users.profile_image',
      // 'users.phone', // Uncomment if you have this column
      'users.city',
      'users.country'
    )
    .count('bookings.id as total_bookings')
    .sum('bookings.total_price as total_spent')
    .max('bookings.check_in as last_visit')
    .where('hotels.manager_id', managerId)
    .groupBy('users.id') // Group by user to aggregate stats
    .orderBy('total_spent', 'desc'); // Show top spenders first
};
