/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('activity_logs', function(table) {
    table.increments('id').primary();
    
    // Link to the Admin/User who performed the action
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('users').onDelete('CASCADE');

    // Action Details
    table.string('action_type', 50).notNullable(); // e.g., 'DELETE_USER', 'BAN_HOTEL'
    table.string('target', 255).nullable();        // e.g., 'User: john_doe'
    table.string('module', 50).nullable();         // e.g., 'Users', 'Finance'
    table.text('details').nullable();              // JSON or description
    
    // Status
    table.enu('status', ['success', 'warning', 'error', 'info'])
         .defaultTo('success');

    // Timestamp
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('activity_logs');
};