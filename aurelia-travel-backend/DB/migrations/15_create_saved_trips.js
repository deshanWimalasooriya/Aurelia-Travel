/**
 * Knex Migration: 15_create_saved_trips.js
 * Creates saved_trips and trip_items tables for Aurelia Travel Smart Plan persistence & sharing
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🗺️ Creating saved_trips & trip_items tables for Smart Plan Phase 3...');

  // 1. Create saved_trips table
  const hasSavedTrips = await knex.schema.hasTable('saved_trips');
  if (!hasSavedTrips) {
    await knex.schema.createTable('saved_trips', (table) => {
      table.increments('id').primary();
      
      // Foreign Key to users.id (nullable for guest saves or linked on login)
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL').index();
      
      table.string('title', 255).notNullable();
      table.string('destination_city', 100).notNullable().index();
      table.integer('duration_days').defaultTo(1).notNullable();
      
      table.decimal('target_budget_usd', 10, 2).defaultTo(0.00);
      table.decimal('total_estimated_cost_usd', 10, 2).defaultTo(0.00);
      
      table.string('transport_mode', 50).defaultTo('Private Van');
      table.string('vibe', 50).defaultTo('Relaxing');
      
      // Unique shareable UUID for public sharing (no JWT required)
      table.string('share_uuid', 64).unique().notNullable().index();
      table.boolean('is_public').defaultTo(true).notNullable();
      
      table.timestamps(true, true);
    });
    console.log('✅ Created saved_trips table successfully.');
  }

  // 2. Create trip_items table
  const hasTripItems = await knex.schema.hasTable('trip_items');
  if (!hasTripItems) {
    await knex.schema.createTable('trip_items', (table) => {
      table.increments('id').primary();
      
      // Foreign Key to saved_trips.id with CASCADE deletion
      table.integer('trip_id').unsigned().notNullable().references('id').inTable('saved_trips').onDelete('CASCADE').index();
      
      table.enu('item_type', ['hotel', 'place']).notNullable().index();
      table.integer('reference_id').unsigned().nullable(); // references hotels.id or tourist_places.id
      
      table.integer('day_number').defaultTo(1).notNullable().index();
      table.integer('order_index').defaultTo(0).notNullable();
      
      table.string('time_slot', 100).nullable();
      table.text('custom_notes').nullable();
      table.decimal('estimated_cost_usd', 10, 2).defaultTo(0.00);
      
      table.timestamps(true, true);
    });
    console.log('✅ Created trip_items table successfully.');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('🗑️ Dropping trip_items and saved_trips tables...');
  await knex.schema.dropTableIfExists('trip_items');
  await knex.schema.dropTableIfExists('saved_trips');
};

