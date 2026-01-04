exports.up = function(knex) {
  return knex.schema
    .dropTableIfExists('bookings') // <--- Added this
    .createTable('bookings', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('room_id').unsigned().references('id').inTable('rooms').onDelete('CASCADE');
      //add adults and children columns
      table.integer('adults').notNullable();
      table.integer('children').notNullable();
      table.date('check_in').notNullable();
      table.date('check_out').notNullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.string('status').defaultTo('confirmed');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('bookings');
};