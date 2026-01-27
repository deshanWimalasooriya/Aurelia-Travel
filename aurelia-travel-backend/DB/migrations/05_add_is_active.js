/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add is_active column to HOTELS
  await knex.schema.table('hotels', (table) => {
    table.boolean('is_active').defaultTo(true); // Default to visible
  });

  // Add is_active column to ROOMS
  await knex.schema.table('rooms', (table) => {
    table.boolean('is_active').defaultTo(true);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('hotels', (table) => table.dropColumn('is_active'));
  await knex.schema.table('rooms', (table) => table.dropColumn('is_active'));
};