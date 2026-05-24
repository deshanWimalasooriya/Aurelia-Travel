/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.alterTable('bookings', (table) => {
    table.string('guest_first_name');
    table.string('guest_last_name');
    table.string('guest_email');
    table.string('guest_country');
    table.string('guest_phone');
    table.string('arrival_time');
    // Note: 'special_requests' already exists in your table from 03_bookings_crm.js
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('guest_first_name');
    table.dropColumn('guest_last_name');
    table.dropColumn('guest_email');
    table.dropColumn('guest_country');
    table.dropColumn('guest_phone');
    table.dropColumn('arrival_time');
  });
};