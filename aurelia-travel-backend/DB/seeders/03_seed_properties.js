/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🏨 Seeding Hotels, Rooms & Inventory...');

  // 1. Clean tables (Order matters due to Foreign Keys)
  await knex('room_availability').del();
  await knex('room_images').del();
  await knex('rooms').del();
  await knex('hotel_amenities').del();
  await knex('hotel_images').del();
  await knex('hotels').del();

  // 2. Fetch dependencies
  const manager = await knex('users').where({ role: 'hotel_manager' }).first();
  const allAmenities = await knex('amenities').select('id', 'name');

  // Helper: Find amenity ID by name
  const getAmenityId = (name) => {
    const found = allAmenities.find(a => a.name === name);
    return found ? found.id : null;
  };

  if (!manager) {
    console.log('⚠️ No Manager found. Run 02_seed_users.js first!');
    return;
  }

  // ===============================================
  // HOTEL 1: The Urban Sky Hotel (Colombo)
  // ===============================================
  const [hotel1Id] = await knex('hotels').insert({
    name: 'The Urban Sky Hotel',
    manager_id: manager.id,
    address_line_1: 'No. 45, Lotus Tower Road',
    city: 'Colombo',
    state: 'Western Province',
    country: 'Sri Lanka',
    latitude: 6.9271,
    longitude: 79.8612,
    description: 'A modern masterpiece in the heart of the city. Perfect for business travelers featuring a rooftop lounge and smart-rooms.',
    phone: '+94 11 223 3445',
    email: 'reservations@urbansky.lk',
    rating_average: 4.8,
    main_image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
  });

  // 1.1 Add Images
  await knex('hotel_images').insert([
    { hotel_id: hotel1Id, image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', is_primary: true },
    { hotel_id: hotel1Id, image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', image_type: 'exterior' },
    { hotel_id: hotel1Id, image_url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7', image_type: 'dining' }
  ]);

  // 1.2 Link Amenities (Pool, WiFi, Gym)
  const amenitiesToLink = ['WiFi', 'Pool', 'Gym', 'Bar', 'Air Conditioning'];
  const amenityInserts = amenitiesToLink
    .map(name => getAmenityId(name))
    .filter(id => id) // Remove nulls
    .map(amenity_id => ({ hotel_id: hotel1Id, amenity_id }));
  
  await knex('hotel_amenities').insert(amenityInserts);

  // 1.3 Create Rooms
  // --- Room A: Luxury Suite ---
  const [roomAId] = await knex('rooms').insert({
    hotel_id: hotel1Id,
    title: 'Skyline Luxury Suite',
    room_type: 'Suite',
    capacity: 2,
    base_price_per_night: 250.00,
    size_sqm: 45,
    view_type: 'city',
    bed_type: 'king',
    has_breakfast: true,
    total_quantity: 5, // We have 5 of these rooms physically
    main_image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427'
  });

  // Room A Images
  await knex('room_images').insert([
    { room_id: roomAId, image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427', is_primary: true },
    { room_id: roomAId, image_url: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a', caption: 'Bathroom' }
  ]);

  // Room A Availability (Generate 30 Days)
  const availabilityDataA = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    availabilityDataA.push({
      room_id: roomAId,
      date: date,
      available_quantity: 5, // Starts full
      dynamic_price: i === 5 ? 300.00 : 250.00 // Example: Higher price on day 5
    });
  }
  await knex('room_availability').insert(availabilityDataA);


  // ===============================================
  // HOTEL 2: Aurelia Grand Resort (Galle)
  // ===============================================
  const [hotel2Id] = await knex('hotels').insert({
    name: 'Aurelia Grand Resort',
    manager_id: manager.id,
    address_line_1: '123 Ocean Drive',
    city: 'Galle',
    state: 'Southern Province',
    country: 'Sri Lanka',
    latitude: 6.0535,
    longitude: 80.2210,
    description: 'Experience the pinnacle of luxury with world-class amenities including an infinity pool and private beach access.',
    phone: '+94 91 222 3333',
    rating_average: 4.9,
    main_image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9'
  });

  // Link Amenities
  const beachAmenities = ['WiFi', 'Pool', 'Spa', 'Bar', 'Restaurant', 'Bathtub'];
  const beachAmenityInserts = beachAmenities
    .map(name => getAmenityId(name))
    .filter(id => id)
    .map(amenity_id => ({ hotel_id: hotel2Id, amenity_id }));
  
  await knex('hotel_amenities').insert(beachAmenityInserts);

  // Create Room: Ocean Chalet
  const [roomBId] = await knex('rooms').insert({
    hotel_id: hotel2Id,
    title: 'Ocean View Chalet',
    room_type: 'Double',
    capacity: 2,
    base_price_per_night: 180.00,
    size_sqm: 35,
    view_type: 'sea',
    bed_type: 'queen',
    has_breakfast: true,
    total_quantity: 10,
    main_image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4'
  });

  // Room B Availability (30 Days)
  const availabilityDataB = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    availabilityDataB.push({
      room_id: roomBId,
      date: date,
      available_quantity: 10,
      dynamic_price: 180.00
    });
  }
  await knex('room_availability').insert(availabilityDataB);

  console.log('✅ Hotels, Rooms & Inventory Seeded!');
};