/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🌱 Seeding Hotels & Rooms...');

  // 1. Clean existing entries (Delete rooms first because they depend on hotels)
  await knex('rooms').del();
  await knex('hotels').del();

  // 2. Insert HOTELS (Without .returning())
  await knex('hotels').insert([
    {
      name: 'Aurelia Grand Resort',
      address_line_1: '123 Ocean Drive',
      address_line_2: 'Building A',
      address_line_3: '',
      city: 'Galle',
      province: 'Southern Province',
      country: 'Sri Lanka',
      postal_code: '80000',
      description: 'Experience the pinnacle of luxury at the Aurelia Grand. Nestled on the coast, we offer a sanctuary of peace with world-class amenities including an infinity pool and private beach access.',
      facilities: JSON.stringify(['Infinity Pool', 'Spa', 'Private Beach', 'Free WiFi', 'Fitness Center', 'Bar']),
      rating_average: 4.8,
      total_reviews: 124,
      image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'
    },
    {
      name: 'The Urban Sky Hotel',
      address_line_1: '45 Lotus Tower Rd',
      address_line_2: '',
      address_line_3: '',
      city: 'Colombo',
      province: 'Western Province',
      country: 'Sri Lanka',
      postal_code: '00100',
      description: 'A modern masterpiece in the heart of the city. Perfect for business travelers and city explorers, featuring a rooftop lounge and smart-rooms.',
      facilities: JSON.stringify(['Rooftop Bar', 'Conference Room', 'Gym', 'Smart Rooms', 'Valet Parking']),
      rating_average: 4.5,
      total_reviews: 89,
      image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop'
    }
  ]);

  // 3. FETCH IDs MANUALLY (The MySQL Fix)
  // We query the database to get the IDs of the hotels we just created
  const hotels = await knex('hotels').select('id', 'name');
  
  const hotel1 = hotels.find(h => h.name === 'Aurelia Grand Resort');
  const hotel2 = hotels.find(h => h.name === 'The Urban Sky Hotel');

  if (!hotel1 || !hotel2) {
      console.error("❌ CRITICAL: Could not find created hotels. Seeding aborted.");
      return;
  }

  console.log(`✅ Hotels Created: ${hotel1.name} (ID: ${hotel1.id}), ${hotel2.name} (ID: ${hotel2.id})`);

  // 4. Insert ROOMS linked to the IDs we found
  await knex('rooms').insert([
    // --- Rooms for Hotel 1 (Resort) ---
    {
      hotel_id: hotel1.id,
      title: 'Ocean View Chalet',
      room_type: 'Chalet',
      capacity: 2,
      price_per_night: 250.00,
      size_sqm: 45,
      smoking_allowed: false,
      description: 'Wake up to the sound of waves in this spacious chalet featuring direct beach access and a private patio.',
      facilities: JSON.stringify(['King Size Bed', 'Ocean View', 'Private Patio', 'Mini Bar', 'AC']),
      bathroom_amenities: JSON.stringify(['Rain Shower', 'Organic Toiletries', 'Bathrobes', 'Hairdryer', 'Slippers']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2070&auto=format&fit=crop'
      ])
    },
    {
      hotel_id: hotel1.id,
      title: 'Family Garden Suite',
      room_type: 'Suite',
      capacity: 4,
      price_per_night: 450.00,
      size_sqm: 80,
      smoking_allowed: false,
      description: 'Perfect for families, this suite offers two bedrooms and a large living area opening into our tropical gardens.',
      facilities: JSON.stringify(['2 King Beds', 'Garden View', 'Kitchenette', 'Smart TV', 'AC']),
      bathroom_amenities: JSON.stringify(['Bathtub', 'Towels', 'Kids Toiletries', 'Hairdryer']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=2070&auto=format&fit=crop'
      ])
    },

    // --- Rooms for Hotel 2 (City) ---
    {
      hotel_id: hotel2.id,
      title: 'Executive City Room',
      room_type: 'Double',
      capacity: 2,
      price_per_night: 120.00,
      size_sqm: 30,
      smoking_allowed: true,
      description: 'A sleek, modern room designed for productivity and comfort with stunning skyline views.',
      facilities: JSON.stringify(['Work Desk', 'High-Speed WiFi', 'City View', 'Soundproofing']),
      bathroom_amenities: JSON.stringify(['Shower', 'Towels', 'Shaving Kit']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop'
      ])
    }
  ]);

  console.log('✅ Rooms Seeding Completed.');
};