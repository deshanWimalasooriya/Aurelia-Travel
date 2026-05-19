exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.boolean('is_verified').defaultTo(false);
    table.string('verification_token').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_verified');
    table.dropColumn('verification_token');
  });
};