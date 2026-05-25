/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    // Adds the room_count column. 
    // Defaulting to 1 ensures old bookings don't break or have NULL values.
    table.integer('room_count').notNullable().defaultTo(1).after('room_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    // Removes the column if you ever need to rollback the migration
    table.dropColumn('room_count');
  });
};