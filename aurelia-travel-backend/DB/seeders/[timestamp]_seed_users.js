const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('password123', 10);

  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      
      // Profile Image
      profile_image: 'https://example.com/images/admin-profile.jpg',
      
      // Address Details
      address_line_1: '123 Main Street',
      address_line_2: 'Suite 500',
      address_line_3: 'Building A',
      city: 'New York',
      postal_code: '10001',
      country: 'United States',
      
      // Payment Card Details (Use tokenized data in production)
      card_type: 'Visa',
      card_number: 'tok_visa_4242', // Payment token (NOT real card number)
      cvv: null, // DO NOT store CVV in production
      expiry_date: '12/27'
    },
    {
      username: 'testuser',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'user',
      
      // Profile Image
      profile_image: 'https://example.com/images/user-profile.jpg',
      
      // Address Details
      address_line_1: '456 Oak Avenue',
      address_line_2: 'Apartment 12B',
      address_line_3: null,
      city: 'Los Angeles',
      postal_code: '90001',
      country: 'United States',
      
      // Payment Card Details (Use tokenized data in production)
      card_type: 'MasterCard',
      card_number: 'tok_mastercard_5555', // Payment token (NOT real card number)
      cvv: null, // DO NOT store CVV in production
      expiry_date: '06/26'
    },
    {
      username: 'johndoe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'user',
      
      // Profile Image
      profile_image: null, // User without profile image
      
      // Address Details
      address_line_1: '789 Elm Street',
      address_line_2: null,
      address_line_3: null,
      city: 'Chicago',
      postal_code: '60601',
      country: 'United States',
      
      // Payment Card Details (Use tokenized data in production)
      card_type: 'American Express',
      card_number: 'tok_amex_3782', // Payment token (NOT real card number)
      cvv: null, // DO NOT store CVV in production
      expiry_date: '03/28'
    }
  ]);
};
