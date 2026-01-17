/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🏗️  Building: Identity, Payments, and Hotel Properties...');

  // 1. Clean Slate: Drop all tables in reverse dependency order
  const tables = [
    'complaints_suggestions', 'itinerary_activities', 'travel_itineraries', 
    'audit_logs', 'notifications', 'wishlists', 'reviews', 
    'payment_transactions', 'bookings', 'room_availability', 
    'room_images', 'rooms', 'hotel_amenities', 'amenities', 
    'hotel_images', 'hotels', 'payment_methods', 'promo_codes', 'users'
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }

  // 2. Create USERS Table (Auth Hub - No Card Details!)
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.enu('role', ['user', 'admin', 'hotel_manager']).defaultTo('user');

    // Profile
    table.string('first_name');
    table.string('last_name');
    table.string('phone');
    table.string('profile_image');
    table.text('bio');
    
    // Address
    table.string('address_line_1');
    table.string('city');
    table.string('country');
    table.string('postal_code');
    
    // Security & Status
    table.boolean('is_active').defaultTo(true);
    table.timestamp('deleted_at').nullable(); // Soft Delete
    table.timestamps(true, true);
  });

  // 3. Create PAYMENT_METHODS (PCI Compliance Vault)
  await knex.schema.createTable('payment_methods', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    
    table.string('provider').notNullable(); // 'stripe', 'paypal'
    table.string('payment_method_id').notNullable(); // The Token (e.g., 'pm_12345')
    table.string('card_last_four').notNullable(); // Display only (e.g., '4242')
    table.string('card_brand'); // 'visa', 'mastercard'
    table.string('card_type').defaultTo('debit'); // 'credit', 'debit'
    
    table.boolean('is_default').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    
    table.timestamps(true, true);
  });

  // 4. Create AMENITIES (Master Feature List)
  await knex.schema.createTable('amenities', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique(); 
    table.string('slug').notNullable().unique();// 'WiFi', 'Pool'
    table.string('icon'); // FontAwesome class or Emoji
    table.enu('category', ['general', 'room', 'safety', 'accessibility', 'dining']).defaultTo('general');
    table.timestamps(true, true);
  });

  // 5. Create HOTELS (Properties)
  await knex.schema.createTable('hotels', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('manager_id').unsigned().references('id').inTable('users').onDelete('SET NULL');

    // Location (Advanced)
    table.string('address_line_1').notNullable();
    table.string('city').notNullable();
    table.string('state');
    table.string('country').notNullable();
    table.string('postal_code');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);

    // Details
    table.text('description');
    table.text('short_description');
    table.time('check_in_time').defaultTo('14:00:00');
    table.time('check_out_time').defaultTo('11:00:00');
    table.integer('cancellation_policy_hours').defaultTo(24);
    
    // Contact (Embedded - No separate table needed)
    table.string('phone'); // Public Front Desk
    table.string('email'); // Public Inquiries
    table.string('website');
    table.string('contact_phone'); // Private/Admin use

    // Stats
    table.decimal('rating_average', 3, 2).defaultTo(0);
    table.integer('total_reviews').defaultTo(0);
    table.string('slug').unique(); // For SEO URLs
    table.boolean('is_featured').defaultTo(false);
    
    // Main Image (Thumbnail)
    table.string('main_image');

    table.timestamps(true, true);
  });

  // 6. Create HOTEL_IMAGES (Gallery)
  await knex.schema.createTable('hotel_images', (table) => {
    table.increments('id').primary();
    table.integer('hotel_id').unsigned().references('id').inTable('hotels').onDelete('CASCADE');
    table.string('image_url').notNullable();
    table.enu('image_type', ['exterior', 'room', 'amenity', 'dining', 'other']).defaultTo('other');
    table.boolean('is_primary').defaultTo(false);
    table.timestamps(true, true);
  });

  // 7. Create HOTEL_AMENITIES (Junction Table)
  await knex.schema.createTable('hotel_amenities', (table) => {
    table.increments('id').primary();
    table.integer('hotel_id').unsigned().references('id').inTable('hotels').onDelete('CASCADE');
    table.integer('amenity_id').unsigned().references('id').inTable('amenities').onDelete('CASCADE');
    table.unique(['hotel_id', 'amenity_id']); // Prevent duplicate tags
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  // We use the array in 'up' to drop everything cleanly
};