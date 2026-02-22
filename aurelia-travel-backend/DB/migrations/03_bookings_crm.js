/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('📅  Building: Bookings, Reviews, and CRM...');

  // 1. Create BOOKINGS
  await knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('RESTRICT'); 
    table.integer('hotel_id').unsigned().references('id').inTable('hotels').onDelete('RESTRICT');
    table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('RESTRICT');
    
    table.string('booking_reference').unique(); // "BKG-2026-X89Z"
    
    // Dates
    table.date('check_in').notNullable();
    table.date('check_out').notNullable();
    table.integer('number_of_nights').notNullable();
    
    // Guests
    table.integer('adults').defaultTo(1);
    table.integer('children').defaultTo(0);
    table.text('special_requests');
    
    // Money
    table.decimal('room_price', 10, 2).notNullable();
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('service_charge', 10, 2).defaultTo(0);
    table.decimal('total_price', 10, 2).notNullable();
    
    // Status
    table.enu('status', ['pending', 'confirmed', 'cancelled', 'completed', 'refunded']).defaultTo('pending');
    table.enu('payment_status', ['pending', 'paid', 'partially_paid', 'refunded']).defaultTo('pending');
    
    table.timestamps(true, true);
  });

  // 2. Create PAYMENT_TRANSACTIONS
  await knex.schema.createTable('payment_transactions', (table) => {
    table.increments('id').primary();
    table.integer('booking_id').unsigned().references('id').inTable('bookings').onDelete('RESTRICT');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('RESTRICT');
    
    table.string('transaction_id').notNullable(); // Stripe/PayPal ID
    table.string('payment_provider').notNullable(); // 'stripe', 'paypal'
    table.decimal('amount', 10, 2).notNullable();
    table.string('status').notNullable(); // 'succeeded', 'failed'
    table.enu('transaction_type', ['payment', 'refund']).defaultTo('payment');
    
    table.timestamps(true, true);
  });

  // 3. Create REVIEWS
  await knex.schema.createTable('reviews', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('hotel_id').unsigned().references('id').inTable('hotels').onDelete('CASCADE');
    table.integer('booking_id').unsigned().references('id').inTable('bookings'); // Verified stay
    
    table.integer('rating').notNullable(); // Overall 1-5
    table.integer('cleanliness_rating');
    table.integer('location_rating');
    table.integer('service_rating');
    
    table.string('title');
    table.text('comment');
    table.text('hotel_response'); // Manager reply
    table.boolean('is_approved').defaultTo(true); // Moderation
    
    table.timestamps(true, true);
  });

  // 4. Create COMPLAINTS_SUGGESTIONS (New CRM)
  await knex.schema.createTable('complaints_suggestions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('hotel_id').unsigned().references('id').inTable('hotels').onDelete('CASCADE');
    table.integer('booking_id').unsigned().references('id').inTable('bookings').onDelete('SET NULL');
    
    table.string('ticket_number').unique(); // "TKT-999"
    table.enu('type', ['complaint', 'suggestion', 'inquiry', 'praise']).notNullable();
    table.string('category'); // 'cleanliness', 'billing', etc.
    table.enu('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    table.enu('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
    
    table.string('subject').notNullable();
    table.text('description').notNullable();
    
    // Resolution
    table.text('resolution_notes');
    table.timestamp('resolved_at');
    table.text('hotel_response');
    
    table.timestamps(true, true);
  });
  
  // 5. Create WISHLISTS
  await knex.schema.createTable('wishlists', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('hotel_id').unsigned().references('id').inTable('hotels').onDelete('CASCADE');
      table.unique(['user_id', 'hotel_id']);
      table.timestamps(true, true);
  });

  // 6. Create NOTIFICATIONS
  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.string('type').defaultTo('system'); 
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  // Handled in migration 01
};