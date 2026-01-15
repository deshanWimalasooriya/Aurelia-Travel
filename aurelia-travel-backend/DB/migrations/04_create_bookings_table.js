/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .dropTableIfExists('bookings')
    .createTable('bookings', (table) => {
      table.increments('id').primary();

      // --- RELATIONSHIPS ---
      // Link to User
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

      // Link to Hotel (Useful for quick queries without joining rooms)
      table.integer('hotel_id').unsigned().notNullable();
      table.foreign('hotel_id').references('id').inTable('hotels').onDelete('CASCADE');

      // Link to Specific Room
      table.integer('room_id').unsigned().notNullable();
      table.foreign('room_id').references('id').inTable('rooms').onDelete('CASCADE');

      // --- BOOKING DETAILS ---
      table.date('check_in').notNullable();
      table.date('check_out').notNullable();
      
      // Guest Info
      table.integer('adults').defaultTo(1);
      table.integer('children').defaultTo(0);

      // Financials
      table.decimal('total_price', 10, 2).notNullable(); // 10 digits total, 2 decimal places
      
      // Status: 'pending', 'confirmed', 'cancelled', 'completed'
      table.string('status').defaultTo('confirmed');

      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('bookings');
};