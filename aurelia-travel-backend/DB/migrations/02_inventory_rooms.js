/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🛏️  Building: Rooms, Gallery, and Availability...');

  // 1. Create ROOMS
  await knex.schema.createTable('rooms', (table) => {
    table.increments('id').primary();
    table.integer('hotel_id').unsigned().references('id').inTable('hotels').onDelete('CASCADE');
    
    table.string('title').notNullable(); // "Deluxe Ocean Suite"
    table.string('room_type').notNullable(); // "Suite", "Single", "Double"
    table.text('description');
    
    // Capacity
    table.integer('max_adults').defaultTo(2);
    table.integer('max_children').defaultTo(1);
    table.integer('capacity').defaultTo(3); // Total
    
    // Pricing & Details
    table.decimal('base_price_per_night', 10, 2).notNullable();
    table.integer('size_sqm');
    table.boolean('has_breakfast').defaultTo(false);
    table.boolean('is_refundable').defaultTo(true);
    table.boolean('smoking_allowed').defaultTo(false);
    table.string('view_type').defaultTo('none'); // 'sea', 'city'
    table.string('bed_type').defaultTo('double'); // 'king', 'queen'
    
    // Inventory Base (Max possible rooms of this type)
    table.integer('total_quantity').defaultTo(1); 
    
    table.string('main_image'); // Cached thumbnail
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);
  });

  // 2. Create ROOM_IMAGES (Detailed Gallery - NEW TABLE)
  await knex.schema.createTable('room_images', (table) => {
    table.increments('id').primary();
    table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('CASCADE');
    table.string('image_url').notNullable();
    table.string('caption'); // e.g., "Ensuite Bathroom"
    table.boolean('is_primary').defaultTo(false);
    table.integer('display_order').defaultTo(0);
    table.timestamps(true, true);
  });

  // 3. Create ROOM_AVAILABILITY (Dynamic Inventory)
  await knex.schema.createTable('room_availability', (table) => {
    table.increments('id').primary();
    table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('CASCADE');
    
    table.date('date').notNullable();
    table.integer('available_quantity').notNullable();
    table.decimal('dynamic_price', 10, 2); // Override base price for holidays
    table.boolean('is_blocked').defaultTo(false);
    
    table.unique(['room_id', 'date']); // One record per room per day
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  // Handled in migration 01
};