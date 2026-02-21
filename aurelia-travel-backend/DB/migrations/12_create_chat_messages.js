exports.up = function(knex) {
  console.log('💬 Creating Chat Messages table...');
  return knex.schema.createTable('chat_messages', (table) => {
    table.increments('id').primary();
    
    // The user/manager who owns this chat thread
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE'); 
    
    // Identifies who sent the specific message
    table.enu('sender', ['user', 'admin']).notNullable(); 
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('chat_messages');
};