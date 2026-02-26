/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    // Adds a boolean column, defaulting to false
    table.boolean('is_two_factor_enabled').defaultTo(false);
    
    // Adds a string column to store the secret key. Nullable because 
    // users won't have it until they turn 2FA on.
    table.string('two_factor_secret').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    // If you ever need to rollback, this removes the columns
    table.dropColumn('is_two_factor_enabled');
    table.dropColumn('two_factor_secret');
  });
};