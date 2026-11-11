/**
 * Knex Migration: 14_create_tourist_places.js
 * Creates the tourist_places table for Aurelia Travel AI Smart Plan
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🏛️  Creating tourist_places table for Sri Lanka Smart Plan...');

  const exists = await knex.schema.hasTable('tourist_places');
  if (!exists) {
    await knex.schema.createTable('tourist_places', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('city', 100).notNullable().index();
      
      // Category restricted to the core travel types: Nature, History, Culture, Adventure, Relaxation
      table.enu('category', ['Nature', 'History', 'Culture', 'Adventure', 'Relaxation']).notNullable().index();
      table.text('description').nullable();
      
      table.decimal('latitude', 10, 8).notNullable();
      table.decimal('longitude', 11, 8).notNullable();
      
      table.integer('estimated_time_spent_mins').defaultTo(90).notNullable();
      table.decimal('entry_fee_usd', 10, 2).defaultTo(0.00).notNullable().index();
      table.string('image_url', 500).nullable();
      table.decimal('rating', 3, 2).defaultTo(4.50).index();

      table.timestamps(true, true);
    });
    console.log('✅ Created tourist_places table successfully.');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('🗑️  Dropping tourist_places table...');
  await knex.schema.dropTableIfExists('tourist_places');
};
