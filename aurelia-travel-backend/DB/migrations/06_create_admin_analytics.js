// aurelia-travel-backend/DB/migrations/06_create_admin_analytics.js
exports.up = function(knex) {
  return knex.schema
    .createTable('admin_analytics', (table) => {
      table.increments('id').primary();
      table.date('date').notNullable();
      table.integer('daily_bookings').defaultTo(0);
      table.decimal('daily_revenue', 10, 2).defaultTo(0);
      table.integer('new_users').defaultTo(0);
      table.integer('active_users').defaultTo(0);
      table.decimal('avg_booking_value', 10, 2).defaultTo(0);
      table.timestamps(true, true);
      table.unique('date');
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('admin_analytics');
};