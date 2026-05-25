/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.alterTable('bookings', (table) => {
    // Stores 'card' or 'arrival'
    table.string('payment_method').defaultTo('card'); 
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('payment_method');
  });
};