exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username').notNullable().unique();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();  // hashed password
    table.string('role').defaultTo('user'); // e.g., 'user', 'admin'
    
    // Profile Image
    table.string('profile_image').nullable(); // URL or file path to profile image
    
    // Address Details (3 lines)
    table.string('address_line_1').nullable(); // Street address, P.O. box
    table.string('address_line_2').nullable(); // Apartment, suite, unit, building, floor
    table.string('address_line_3').nullable(); // Additional address details
    table.string('city').nullable();
    table.string('postal_code').nullable();
    table.string('country').nullable();
    
    // Payment Card Details
    table.string('card_type').nullable(); // 'Visa', 'MasterCard', 'American Express', etc.
    table.string('card_number').nullable(); // Store encrypted/tokenized - DO NOT store plain text
    table.string('cvv').nullable(); // Store encrypted - DO NOT store plain text (PCI compliance)
    table.string('expiry_date').nullable(); // Format: MM/YY
    
    table.timestamps(true, true); // created_at and updated_at
  });
};


exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
