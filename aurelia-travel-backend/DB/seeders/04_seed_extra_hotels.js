/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🌴 Seeding Extra Hotels (Phase 2)...');

  // 1. GET DEPENDENCIES
  // ----------------------------------------------------
  let manager = await knex('users').where({ role: 'hotel_manager' }).first();
  if (!manager) {
    manager = await knex('users').first();
  }
  const managerId = manager ? manager.id : null;

  // Get Amenities Map (slug -> id)
  // Note: Your amenities table might use 'name' instead of 'slug' depending on previous fixes.
  // We'll try to match by name or slug.
  const allAmenities = await knex('amenities').select('id', 'name', 'slug');
  const getAmenityId = (slugOrName) => {
    // Try finding by slug first, then name
    const found = allAmenities.find(a => 
      (a.slug && a.slug === slugOrName) || (a.name && a.name.toLowerCase() === slugOrName.toLowerCase())
    );
    return found ? found.id : null;
  };

  // 2. DATA: 15 NEW HOTELS
  // ----------------------------------------------------
  const extraHotels = [
    // EAST COAST
    {
      name: "Jetwing Surf",
      city: "Arugam Bay",
      price: 35000, // This will go into ROOMS, not HOTELS
      image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800",
      desc: "Eco-luxury cabanas on the unexplored eastern coast, perfect for surfers.",
      amenities: ['Beachfront', 'WiFi', 'Restaurant', 'Bar']
    },
    {
      name: "Uga Bay",
      city: "Pasikudah",
      price: 52000,
      image: "https://images.unsplash.com/photo-1615880480595-d502d4b99cc2?w=800",
      desc: "A fusion of tropical Mediterranean architecture on a pristine beach.",
      amenities: ['Pool', 'Beachfront', 'Spa', 'Bar', 'Air Conditioning']
    },
    {
      name: "Maalu Maalu Resort",
      city: "Pasikudah",
      price: 42000,
      image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c78?w=800",
      desc: "Themed after a traditional fishing village, offering a unique cultural experience.",
      amenities: ['Pool', 'Beachfront', 'Restaurant', 'WiFi']
    },

    // DOWN SOUTH
    {
      name: "Anantara Peace Haven",
      city: "Tangalle",
      price: 85000,
      image: "https://images.unsplash.com/photo-1571896349842-6e53ce41e887?w=800",
      desc: "Hidden on a rocky outcrop along a secluded stretch of coastline.",
      amenities: ['Pool', 'Spa', 'Gym', 'Free Parking', 'Beachfront']
    },
    {
      name: "Cape Weligama",
      city: "Weligama",
      price: 95000,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      desc: "Perched on a cliff with panoramic Indian Ocean views.",
      amenities: ['Pool', 'Spa', 'Bar', 'Room Service', 'WiFi']
    },
    {
      name: "Wild Coast Tented Lodge",
      city: "Yala",
      price: 110000,
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
      desc: "Where the jungle meets the ocean. Luxurious tented structures.",
      amenities: ['Pool', 'Restaurant', 'Bar']
    },

    // CULTURAL TRIANGLE
    {
      name: "Cinnamon Lodge",
      city: "Habarana",
      price: 32000,
      image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800",
      desc: "A sanctuary for nature lovers, spread over 27 acres of wooded garden.",
      amenities: ['Pool', 'WiFi', 'Restaurant']
    },
    {
      name: "Ekho Lake House",
      city: "Polonnaruwa",
      price: 28000,
      image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
      desc: "Overlooking the Parakrama Samudra with historic charm.",
      amenities: ['WiFi', 'Restaurant', 'Bar']
    },
    {
      name: "Santani Wellness Kandy",
      city: "Kandy",
      price: 70000,
      image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800",
      desc: "Sri Lanka's first fully-fledged destination spa resort.",
      amenities: ['Spa', 'Gym', 'Pool', 'WiFi']
    },
    
    // HILL COUNTRY
    {
      name: "Melheim Resort",
      city: "Haputale",
      price: 24000,
      image: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800",
      desc: "Wrapped in blankets of mist and surrounded by tea plantations.",
      amenities: ['Restaurant', 'WiFi']
    },
    {
      name: "Living Heritage Koslanda",
      city: "Koslanda",
      price: 36000,
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      desc: "A boutique hotel set in a magical location with its own waterfall.",
      amenities: ['Pool', 'WiFi', 'Restaurant']
    },

    // WEST COAST
    {
      name: "Hikka Tranz by Cinnamon",
      city: "Hikkaduwa",
      price: 29000,
      image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      desc: "The party capital of the south. Trance music and ocean vibes.",
      amenities: ['Pool', 'Bar', 'Beachfront', 'WiFi']
    },
    {
      name: "The Blue Water",
      city: "Wadduwa",
      price: 31000,
      image: "https://images.unsplash.com/photo-1571896349842-6e53ce41e887?w=800",
      desc: "Designed by Geoffrey Bawa, capturing tropical modernism.",
      amenities: ['Pool', 'Beachfront', 'Gym', 'Spa']
    },
    {
      name: "Avani Kalutara Resort",
      city: "Kalutara",
      price: 33000,
      image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
      desc: "Located where the Kalu Ganga meets the ocean.",
      amenities: ['Pool', 'Beachfront', 'Gym']
    },
    {
      name: "Dolphin Beach Resort",
      city: "Kalpitiya",
      price: 27000,
      image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
      desc: "Unique tented accommodation on the untouched beaches.",
      amenities: ['Beachfront', 'Pool', 'WiFi']
    }
  ];

  // 3. INSERT LOOP
  // ----------------------------------------------------
  
  for (const h of extraHotels) {
    // A. Insert Hotel (Schema Compatible)
    const [hotelId] = await knex('hotels').insert({
      name: h.name,
      description: h.desc,
      address_line_1: `${Math.floor(Math.random() * 100) + 1}, Coastal Road`,
      city: h.city,
      country: 'Sri Lanka',
      postal_code: '20000',
      manager_id: managerId,
      // REMOVED: price_per_night_from, is_active (Not in schema)
      rating_average: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1),
      main_image: h.image, // Using main_image column from schema
      created_at: knex.fn.now()
    });

    console.log(`➕ Added Hotel: ${h.name}`);

    // B. Insert Images
    await knex('hotel_images').insert([
      { hotel_id: hotelId, image_url: h.image, is_primary: true },
      { hotel_id: hotelId, image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', is_primary: false }, 
      { hotel_id: hotelId, image_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800', is_primary: false } 
    ]);

    // C. Link Amenities
    const hotelAmenities = h.amenities
      .map(name => getAmenityId(name))
      .filter(id => id) 
      .map(amenity_id => ({ hotel_id: hotelId, amenity_id }));
    
    if (hotelAmenities.length > 0) {
      // Use ignore to skip duplicates
      await knex('hotel_amenities').insert(hotelAmenities).onConflict(['hotel_id', 'amenity_id']).ignore();
    }

    // D. Create Rooms (Standard & Suite)
    const roomTypes = [
      { title: 'Standard Room', type: 'Double', multiplier: 1, qty: 8 },
      { title: 'Premium Suite', type: 'Suite', multiplier: 1.6, qty: 3 }
    ];

    for (const rt of roomTypes) {
      const roomPrice = Math.floor(h.price * rt.multiplier);
      
      const [roomId] = await knex('rooms').insert({
        hotel_id: hotelId,
        title: rt.title,
        room_type: rt.type,
        description: `Experience comfort in our ${rt.title}.`,
        base_price_per_night: roomPrice,
        total_quantity: rt.qty,
        created_at: knex.fn.now()
      });

      // E. Room Images
      await knex('room_images').insert({
        room_id: roomId,
        image_url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
        is_primary: true
      });

      // F. Generate 60 Days Inventory
      const inventory = [];
      const today = new Date();
      for (let i = 0; i < 60; i++) { 
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        inventory.push({
          room_id: roomId,
          date: date,
          available_quantity: rt.qty, 
          dynamic_price: roomPrice
        });
      }
      
      const chunkSize = 50;
      for (let i = 0; i < inventory.length; i += chunkSize) {
        await knex('room_availability').insert(inventory.slice(i, i + chunkSize));
      }
    }
  }

  console.log('✅ Phase 2 Complete: 15 Extra Hotels Added.');
};