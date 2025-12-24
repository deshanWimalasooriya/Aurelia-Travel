// db/migrations/20251223081412_create_hotels.js
exports.up = function(knex) {
  return knex.schema.createTable('hotels', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('location', 255).notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.text('description');
    table.string('image_url', 500);
    table.string('amenities', 1000); // Comma-separated: "WiFi,Pool,AC"
    table.integer('rating').unsigned(); // 1-5 stars
    table.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('hotels');
};
