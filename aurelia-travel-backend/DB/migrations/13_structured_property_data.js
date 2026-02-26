/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🏗️  Adding Structured Data Columns to Hotels and Rooms...');

  await knex.schema.table('hotels', (table) => {
    table.string('property_type').defaultTo('Hotel');
    table.integer('star_rating').defaultTo(3);
    
    // Allowances & Rules
    table.boolean('pets_allowed').defaultTo(false);
    table.boolean('smoking_allowed').defaultTo(false);
    table.boolean('parties_allowed').defaultTo(false);
    table.integer('min_age').defaultTo(18);
    table.decimal('damage_deposit', 10, 2).defaultTo(0);
    table.text('custom_rules');

    // Arrays (Stored as JSON strings)
    table.json('services');
    table.json('languages');
    table.json('accepted_payments');
  });

  await knex.schema.table('rooms', (table) => {
    table.string('bathroom_type').defaultTo('Private En-suite');
    table.text('custom_features');
    
    // Arrays (Stored as JSON strings)
    table.json('room_amenities');
    table.json('bathroom_amenities');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('hotels', (table) => {
    table.dropColumn('property_type');
    table.dropColumn('star_rating');
    table.dropColumn('pets_allowed');
    table.dropColumn('smoking_allowed');
    table.dropColumn('parties_allowed');
    table.dropColumn('min_age');
    table.dropColumn('damage_deposit');
    table.dropColumn('custom_rules');
    table.dropColumn('services');
    table.dropColumn('languages');
    table.dropColumn('accepted_payments');
  });

  await knex.schema.table('rooms', (table) => {
    table.dropColumn('bathroom_type');
    table.dropColumn('custom_features');
    table.dropColumn('room_amenities');
    table.dropColumn('bathroom_amenities');
  });
};