/**
 * @param { import("knex").Knex } knex
 */
exports.up = function(knex) {
  console.log('✉️  Creating Contact Messages table...');
  return knex.schema.createTable('contact_messages', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.text('message').notNullable();
    table.enu('status', ['unread', 'read']).defaultTo('unread');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('contact_messages');
};