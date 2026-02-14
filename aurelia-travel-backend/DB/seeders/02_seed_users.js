const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('👤 Seeding Users...');

  // 1. Clean up DEPENDENT tables first
  // We must delete data in child tables before we can delete the parent (users)
  
  // Financials & CRM linked to users/bookings
  await knex('payment_transactions').del();
  const hasComm = await knex.schema.hasTable('commission_payments');
  if(hasComm) await knex('commission_payments').del();
  
  // User interactions
  await knex('reviews').del();
  await knex('complaints_suggestions').del();
  await knex('notifications').del();
  await knex('wishlists').del();
  
  // Core Dependencies (The source of your error)
  await knex('bookings').del(); 
  await knex('payment_methods').del();

  // 2. Now it is safe to delete Users
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. Insert Users
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
      bio: 'Experienced hotelier with 15 years in luxury hospitality.',
      is_active: true
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
      country: 'Sri Lanka',
      is_active: true
    }
  ]);
  
  console.log('✅ Users Seeded');
};