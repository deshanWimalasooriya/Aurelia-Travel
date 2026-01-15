/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Drop existing tables in reverse order (Rooms depends on Hotels)
  await knex.schema.dropTableIfExists('rooms');
  await knex.schema.dropTableIfExists('hotels');

  // 2. Create HOTELS Table (The Parent)
  await knex.schema.createTable('hotels', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('manager_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    
    // Detailed Location
    table.string('address_line_1').notNullable();
    table.string('address_line_2'); // Optional (e.g., Suite 500)
    table.string('address_line_3'); // Optional (e.g., Building B)
    table.string('city').notNullable();
    table.string('province').notNullable(); // State or Province
    table.string('country').notNullable();
    table.string('postal_code').notNullable();
    
    // Details
    table.text('description'); // Use TEXT for long descriptions
    table.json('facilities'); // Stores array: ["Pool", "WiFi", "Gym"]
    table.decimal('rating_average', 3, 2).defaultTo(0); // e.g., 4.85
    table.integer('total_reviews').defaultTo(0);
    
    // Media
    table.string('image_url'); // Main thumbnail image

    table.timestamps(true, true);
  });

  // 3. Create ROOMS Table (The Child)
  await knex.schema.createTable('rooms', (table) => {
    table.increments('id').primary();
    
    // Relationship
    table.integer('hotel_id').unsigned().notNullable();
    table.foreign('hotel_id').references('id').inTable('hotels').onDelete('CASCADE');

    // Core Info
    table.string('title').notNullable(); // e.g., "Deluxe Ocean Chalet"
    table.string('room_type').notNullable(); // e.g., "Double", "Suite"
    table.integer('capacity').notNullable(); // Number of guests
    table.decimal('price_per_night', 10, 2).notNullable();
    
    // Chalet Specifics
    table.integer('size_sqm'); // Size in square meters
    table.boolean('smoking_allowed').defaultTo(false);
    table.text('description'); // Short description of the room
    
    // Detailed Features (JSON Arrays)
    table.json('facilities'); // e.g., ["Air Conditioning", "Mini Bar"]
    table.json('bathroom_amenities'); // e.g., ["Towels", "Hairdryer", "Bathtub"]
    table.json('photos'); // e.g., ["url1.jpg", "url2.jpg"]

    table.boolean('is_available').defaultTo(true);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('rooms');
  await knex.schema.dropTableIfExists('hotels');
};