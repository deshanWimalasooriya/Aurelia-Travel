const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('👤 Seeding Users...');

  // 1. Clean up
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Insert Users
  await knex('users').insert([
    {
      username: 'admin_master',
      email: 'admin@aurelia.com',
      password: hashedPassword,
      role: 'admin',
      first_name: 'Super',
      last_name: 'Admin',
      is_active: true
    },
    {
      username: 'manager_colombo',
      email: 'manager@urbanhotels.com',
      password: hashedPassword,
      role: 'hotel_manager',
      first_name: 'Rajitha',
      last_name: 'Perera',
      phone: '+94771122334',
      bio: 'Experienced hotelier with 15 years in luxury hospitality.'
    },
    {
      username: 'traveler_jane',
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'user',
      first_name: 'Jane',
      last_name: 'Doe',
      address_line_1: '123 Flower Road',
      city: 'Colombo',
      country: 'Sri Lanka'
    }
  ]);
  
  console.log('✅ Users Seeded');
};