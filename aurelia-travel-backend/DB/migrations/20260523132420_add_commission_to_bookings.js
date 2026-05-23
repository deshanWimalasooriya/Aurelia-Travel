/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('  Adding immutable commission column to bookings...');
  
  return knex.schema.alterTable('bookings', (table) => {
    // Adds the commission column, defaulting to 0.00 for safety
    // DECIMAL(10,2) matches your total_price logic perfectly
    table.decimal('commission', 10, 2).defaultTo(0.00);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('  Rolling back commission column from bookings...');
  
  return knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('commission');
  });
};