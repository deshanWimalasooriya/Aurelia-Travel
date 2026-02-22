/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add a safety check to see if the table is already there
  const exists = await knex.schema.hasTable('notifications');
  
  if (!exists) {
    console.log('🔔 Creating Notifications table...');
    return knex.schema.createTable('notifications', (table) => {
      table.increments('id').primary();
      
      // Who receives it?
      table.integer('user_id').unsigned().notNullable()
          .references('id').inTable('users').onDelete('CASCADE');
      
      // Content
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.string('type').defaultTo('info'); // info, success, warning, error
      table.string('link').nullable(); // e.g. "/profile"
      
      // Status
      table.boolean('is_read').defaultTo(false);
      
      table.timestamps(true, true);
    });
  } else {
    console.log('   -> Notifications table already exists, skipping...');
    return Promise.resolve();
  }
};

exports.down = async function(knex) {
  return knex.schema.dropTableIfExists('notifications');
};