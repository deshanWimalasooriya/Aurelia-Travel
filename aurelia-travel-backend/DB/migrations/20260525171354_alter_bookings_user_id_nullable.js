/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    // This alters the existing column to allow nulls
    table.integer('user_id').unsigned().nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    // Reverts it back to NOT NULL if you ever need to rollback
    table.integer('user_id').unsigned().notNullable().alter();
  });
};