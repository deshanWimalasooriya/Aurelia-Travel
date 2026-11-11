/**
 * Knex Seeder: 05_seed_smart_plan_data.js
 * Generates:
 * 1. 500 realistic synthetic hotels (with rooms & room_availability records)
 * 2. 1000 tourist places categorized into [Nature, History, Culture, Adventure, Relaxation]
 * Clustered within a 10-15km radius of 7 Sri Lankan hubs:
 * Galle, Kandy, Ella, Colombo, Sigiriya, Mirissa, Nuwara Eliya.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const { faker } = require('@faker-js/faker');

// ============================================================================
// 1. MAJOR SRI LANKAN REGIONAL HUBS (7 Target Clusters)
// ============================================================================
const SRI_LANKA_HUBS = [
  {
    city: 'Galle',
    province: 'Southern Province',
    postalCode: '80000',
    lat: 6.0535,
    lng: 80.2210,
    attractionTemplates: [
      { name: 'Dutch Galle Fort Ramparts', cat: 'History', min: 120, fee: 0 },
      { name: 'Galle Lighthouse & Beach Walk', cat: 'Relaxation', min: 60, fee: 0 },
      { name: 'National Maritime Museum', cat: 'Culture', min: 90, fee: 5 },
      { name: 'Unawatuna Coral Sanctuary', cat: 'Nature', min: 150, fee: 12 },
      { name: 'Jungle Beach Coastal Hike', cat: 'Adventure', min: 120, fee: 0 },
      { name: 'Koggala Sea Turtle Hatchery', cat: 'Nature', min: 45, fee: 4 },
      { name: 'Historical Dutch Reformed Church', cat: 'History', min: 45, fee: 0 }
    ],
    hotelKeywords: ['Heritage Villa', 'Fort Retreat', 'Lighthouse Bay Resort', 'Dutch Colonial Suites', 'Southern Sands Haven']
  },
  {
    city: 'Kandy',
    province: 'Central Province',
    postalCode: '20000',
    lat: 7.2906,
    lng: 80.6337,
    attractionTemplates: [
      { name: 'Temple of the Sacred Tooth Relic', cat: 'Culture', min: 120, fee: 15 },
      { name: 'Royal Botanical Gardens Peradeniya', cat: 'Nature', min: 150, fee: 10 },
      { name: 'Kandy Lake Sunset Walkway', cat: 'Relaxation', min: 60, fee: 0 },
      { name: 'Udawattakele Royal Forest Sanctuary', cat: 'Adventure', min: 120, fee: 6 },
      { name: 'Bahirawakanda Giant Buddha Statue', cat: 'Culture', min: 60, fee: 2 },
      { name: 'Ceylon Tea Museum & Plantation', cat: 'History', min: 90, fee: 8 }
    ],
    hotelKeywords: ['Riverfront Retreat', 'Hill Capital Hotel', 'Kandy Lakeview Suites', 'Royal Sanctuary Lodge', 'Highland View Chalets']
  },
  {
    city: 'Ella',
    province: 'Uva Province',
    postalCode: '90090',
    lat: 6.8667,
    lng: 81.0466,
    attractionTemplates: [
      { name: 'Demodara Nine Arches Bridge', cat: 'History', min: 90, fee: 0 },
      { name: 'Little Adams Peak Sunrise Hike', cat: 'Adventure', min: 120, fee: 0 },
      { name: 'Ravana Waterfall & Natural Pool', cat: 'Nature', min: 90, fee: 0 },
      { name: 'Ella Rock Panoramic Trail', cat: 'Adventure', min: 240, fee: 0 },
      { name: 'Flying Ravana Mountain Zipline', cat: 'Adventure', min: 60, fee: 25 },
      { name: 'Halpewatte Tea Factory & Tasting', cat: 'Relaxation', min: 75, fee: 6 }
    ],
    hotelKeywords: ['Cloud 9 Eco Lodge', 'Misty Mountain Retreat', 'Ella Rock View Villa', 'Gap Boutique Hotel', 'Tea Valley Chalets']
  },
  {
    city: 'Colombo',
    province: 'Western Province',
    postalCode: '00100',
    lat: 6.9271,
    lng: 79.8612,
    attractionTemplates: [
      { name: 'Gangaramaya Buddhist Temple', cat: 'Culture', min: 75, fee: 4 },
      { name: 'Galle Face Green Ocean Promenade', cat: 'Relaxation', min: 90, fee: 0 },
      { name: 'National Museum of Colombo', cat: 'History', min: 120, fee: 8 },
      { name: 'Independence Memorial Heritage Hall', cat: 'History', min: 60, fee: 0 },
      { name: 'Viharamahadevi Central Park', cat: 'Nature', min: 60, fee: 0 },
      { name: 'Pettah Floating Bazaar', cat: 'Culture', min: 90, fee: 0 }
    ],
    hotelKeywords: ['Grand Bay Hotel', 'City Centre Suites', 'Ocean Breeze Hotel', 'The Metropolitan Residence', 'Lotus Marina Resort']
  },
  {
    city: 'Sigiriya',
    province: 'Central Province',
    postalCode: '21120',
    lat: 7.9570,
    lng: 80.7603,
    attractionTemplates: [
      { name: 'Sigiriya Ancient Rock Fortress', cat: 'History', min: 180, fee: 30 },
      { name: 'Pidurangala Sunset Rock Climb', cat: 'Adventure', min: 120, fee: 3 },
      { name: 'Minneriya Wild Elephant Safari', cat: 'Nature', min: 210, fee: 35 },
      { name: 'Ancient Royal Water Gardens', cat: 'Culture', min: 60, fee: 0 },
      { name: 'Dambulla Golden Cave Temple', cat: 'Culture', min: 120, fee: 10 },
      { name: 'Habarana Village Lake Catamaran', cat: 'Relaxation', min: 90, fee: 12 }
    ],
    hotelKeywords: ['Lion Rock Eco Resort', 'Kingdom Village Stay', 'Forest Edge Chalets', 'Sigiri Heritage Lodge', 'Royal Rock Haven']
  },
  {
    city: 'Mirissa',
    province: 'Southern Province',
    postalCode: '81740',
    lat: 5.9482,
    lng: 80.4716,
    attractionTemplates: [
      { name: 'Coconut Tree Hill Viewpoint', cat: 'Relaxation', min: 60, fee: 0 },
      { name: 'Secret Beach Hidden Cove', cat: 'Relaxation', min: 150, fee: 0 },
      { name: 'Mirissa Blue Whale Safari', cat: 'Nature', min: 240, fee: 35 },
      { name: 'Parrot Rock Tidal Island', cat: 'Adventure', min: 45, fee: 0 },
      { name: 'Mirissa Bay Sunset Surf Point', cat: 'Adventure', min: 120, fee: 0 }
    ],
    hotelKeywords: ['Beachside Sanctuary', 'Palm Grove Resort', 'Blue Horizon Bay Hotel', 'Sunset Cove Villa', 'Ocean Whisper Lodge']
  },
  {
    city: 'Nuwara Eliya',
    province: 'Central Province',
    postalCode: '22200',
    lat: 6.9497,
    lng: 80.7891,
    attractionTemplates: [
      { name: 'Gregory Lake Boating & Promenade', cat: 'Relaxation', min: 90, fee: 3 },
      { name: 'Hortons Plains & Worlds End Cliff', cat: 'Adventure', min: 240, fee: 25 },
      { name: 'Pedro Tea Estate & Factory', cat: 'Culture', min: 90, fee: 5 },
      { name: 'Victoria Botanical Park Gardens', cat: 'Nature', min: 60, fee: 2 },
      { name: 'Lovers Leap Cascading Waterfall', cat: 'Nature', min: 90, fee: 0 },
      { name: 'Colonial Post Office & Heritage Walk', cat: 'History', min: 45, fee: 0 }
    ],
    hotelKeywords: ['Grand Tudor Manor', 'Little England Heritage Villa', 'Misty Highland Resort', 'Alpine Valley Lodge', 'Ceylon Tea Country Hotel']
  }
];

const VALID_CATEGORIES = ['Nature', 'History', 'Culture', 'Adventure', 'Relaxation'];

const ATTRACTION_PHOTOS = [
  'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
];

const HOTEL_PHOTOS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80'
];

// Helper: Generates coordinates uniformly distributed within a 10-15km radius
function generateClusteredCoordinate(centerLat, centerLng, minRadiusKm = 1.0, maxRadiusKm = 15.0) {
  const radius = minRadiusKm + Math.sqrt(Math.random()) * (maxRadiusKm - minRadiusKm);
  const angle = Math.random() * 2 * Math.PI;
  const kmPerLat = 110.574;
  const kmPerLng = 111.320 * Math.cos(centerLat * (Math.PI / 180));

  return {
    latitude: Number((centerLat + (radius * Math.cos(angle)) / kmPerLat).toFixed(8)),
    longitude: Number((centerLng + (radius * Math.sin(angle)) / kmPerLng).toFixed(8))
  };
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

// ============================================================================
// MAIN SEED EXECUTION
// ============================================================================
exports.seed = async function(knex) {
  console.log('🌴 Seeding 500 Hotels (with inventory & availability) & 1,000 Tourist Places across 7 Sri Lankan hubs...');

  const managerUser = await knex('users')
    .where({ role: 'hotel_manager' })
    .orWhere({ role: 'admin' })
    .first();
  const managerId = managerUser ? managerUser.id : null;

  // --------------------------------------------------------------------------
  // 1. SEED 1,000 TOURIST PLACES
  // --------------------------------------------------------------------------
  const hasTouristPlaces = await knex.schema.hasTable('tourist_places');
  if (!hasTouristPlaces) {
    console.error('❌ Table tourist_places not found. Run migration 14_create_tourist_places.js first!');
    return;
  }

  await knex('tourist_places').del();

  const touristPlaces = [];
  const TOTAL_PLACES = 1000;
  const placesPerHub = Math.ceil(TOTAL_PLACES / SRI_LANKA_HUBS.length);

  for (const hub of SRI_LANKA_HUBS) {
    for (let i = 0; i < placesPerHub && touristPlaces.length < TOTAL_PLACES; i++) {
      const template = hub.attractionTemplates[i % hub.attractionTemplates.length];
      const coords = generateClusteredCoordinate(hub.lat, hub.lng, 0.5, 15.0);
      
      const placeName = i < hub.attractionTemplates.length
        ? `${hub.city} ${template.name}`
        : `${hub.city} ${template.name} ${faker.location.street()}`.replace(/[\d\n\r]/g, '').trim();

      const rating = Number(faker.number.float({ min: 4.10, max: 4.95, fractionDigits: 2 }));
      const fee = template.fee > 0 ? template.fee : (Math.random() < 0.25 ? Number(faker.number.float({ min: 3, max: 20, fractionDigits: 2 })) : 0.00);

      touristPlaces.push({
        name: placeName,
        city: hub.city,
        category: template.cat,
        description: `Immerse in the ${template.cat.toLowerCase()} wonders of ${placeName}. An essential visit in ${hub.city} offering unforgettable sights.`,
        latitude: coords.latitude,
        longitude: coords.longitude,
        estimated_time_spent_mins: template.min,
        entry_fee_usd: fee,
        image_url: faker.helpers.arrayElement(ATTRACTION_PHOTOS),
        rating: rating,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  for (const chunk of chunkArray(touristPlaces, 100)) {
    await knex('tourist_places').insert(chunk);
  }
  console.log(`✅ Seeded ${touristPlaces.length} tourist places.`);

  // --------------------------------------------------------------------------
  // 2. SEED 500 HOTELS WITH ROOMS AND ROOM_AVAILABILITY
  // --------------------------------------------------------------------------
  const TOTAL_HOTELS = 500;
  const hotelsPerHub = Math.ceil(TOTAL_HOTELS / SRI_LANKA_HUBS.length);
  const hotelsToInsert = [];

  for (const hub of SRI_LANKA_HUBS) {
    for (let i = 0; i < hotelsPerHub && hotelsToInsert.length < TOTAL_HOTELS; i++) {
      const keyword = faker.helpers.arrayElement(hub.hotelKeywords);
      const coords = generateClusteredCoordinate(hub.lat, hub.lng, 0.5, 14.5);
      const starRating = faker.helpers.arrayElement([3, 4, 5]);
      const hotelName = `${faker.company.name()} ${keyword}`.replace(/[,.-]/g, '').trim();
      const slug = `${faker.helpers.slugify(hotelName).toLowerCase()}-${faker.string.alphanumeric(6)}`;

      hotelsToInsert.push({
        name: hotelName,
        manager_id: managerId,
        address_line_1: `${faker.number.int({ min: 1, max: 250 })}, ${hub.city} Scenic Highway`,
        city: hub.city,
        state: hub.province,
        country: 'Sri Lanka',
        postal_code: hub.postalCode,
        latitude: coords.latitude,
        longitude: coords.longitude,
        description: `Experience premier Sri Lankan hospitality at ${hotelName} in ${hub.city}. Equipped with panoramic suites, swimming pool, and dining.`,
        short_description: `Charming ${starRating}-star resort in ${hub.city} offering modern comforts.`,
        phone: `+94 ${faker.string.numeric(2)} ${faker.string.numeric(3)} ${faker.string.numeric(4)}`,
        email: `stay@${slug.slice(0, 12)}.lk`,
        website: `https://${slug.slice(0, 12)}.aureliatravel.lk`,
        rating_average: Number(faker.number.float({ min: 3.85, max: 4.95, fractionDigits: 2 })),
        total_reviews: faker.number.int({ min: 14, max: 480 }),
        slug: slug,
        is_featured: starRating === 5 && Math.random() < 0.25,
        main_image: faker.helpers.arrayElement(HOTEL_PHOTOS),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  // Insert hotels in chunks and capture IDs to seed rooms and dynamic availability
  const roomsToInsert = [];
  const hotelChunks = chunkArray(hotelsToInsert, 50);

  for (const chunk of hotelChunks) {
    const insertedIds = await knex('hotels').insert(chunk);
    const firstHotelId = insertedIds[0];

    for (let idx = 0; idx < chunk.length; idx++) {
      const hId = firstHotelId + idx;
      
      // Seed Standard/Deluxe Room
      const basePrice = Number(faker.number.float({ min: 35.00, max: 240.00, fractionDigits: 2 }));
      const capacity = faker.helpers.arrayElement([2, 3, 4]);

      roomsToInsert.push({
        hotel_id: hId,
        title: 'Deluxe Heritage Suite',
        room_type: 'Deluxe',
        description: 'Spacious climate-controlled suite with king bed, balcony, and free WiFi.',
        max_adults: capacity,
        max_children: 1,
        capacity: capacity,
        base_price_per_night: basePrice,
        size_sqm: faker.number.int({ min: 32, max: 60 }),
        has_breakfast: Math.random() < 0.7,
        is_refundable: true,
        view_type: faker.helpers.arrayElement(['sea', 'mountain', 'garden', 'city']),
        bed_type: 'king',
        total_quantity: 8,
        main_image: faker.helpers.arrayElement(HOTEL_PHOTOS),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  // Insert rooms and seed room_availability table
  const availabilityToInsert = [];
  const roomChunks = chunkArray(roomsToInsert, 50);

  // Generate availability for today + next 14 days
  const today = new Date();
  const dateStrings = [];
  for (let d = 0; d < 14; d++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + d);
    dateStrings.push(nextDate.toISOString().split('T')[0]);
  }

  for (const chunk of roomChunks) {
    const insertedRoomIds = await knex('rooms').insert(chunk);
    const firstRoomId = insertedRoomIds[0];

    // Seed room availability for each room
    for (let rIdx = 0; rIdx < chunk.length; rIdx++) {
      const rId = firstRoomId + rIdx;
      for (const dStr of dateStrings) {
        availabilityToInsert.push({
          room_id: rId,
          date: dStr,
          available_quantity: faker.number.int({ min: 2, max: 7 }),
          dynamic_price: null,
          is_blocked: false
        });
      }
    }
  }

  // Insert availability in chunks of 500
  if (availabilityToInsert.length > 0) {
    const availChunks = chunkArray(availabilityToInsert, 500);
    for (const aChunk of availChunks) {
      await knex('room_availability').insert(aChunk);
    }
    console.log(`✅ Seeded ${availabilityToInsert.length} room availability dates for live booking queries.`);
  }

  console.log(`✅ Successfully seeded ${hotelsToInsert.length} hotels with rooms and live availability.`);
};
