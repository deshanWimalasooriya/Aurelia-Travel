/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🌱 Seeding Master Amenities...');

  // 1. Clear existing
  // We must delete from dependent tables first to avoid foreign key errors
  await knex('hotel_amenities').del(); 
  await knex('amenities').del();

  // 2. Define standard amenities with SLUGS
  const amenities = [
    // General
    { name: 'WiFi', slug: 'wifi', category: 'general', icon: 'fa-wifi' },
    { name: 'Parking', slug: 'parking', category: 'general', icon: 'fa-parking' },
    
    // Recreation
    { name: 'Pool', slug: 'pool', category: 'recreation', icon: 'fa-swimming-pool' },
    { name: 'Gym', slug: 'gym', category: 'recreation', icon: 'fa-dumbbell' },
    { name: 'Spa', slug: 'spa', category: 'recreation', icon: 'fa-spa' },
    
    // Dining
    { name: 'Restaurant', slug: 'restaurant', category: 'dining', icon: 'fa-utensils' },
    { name: 'Bar', slug: 'bar', category: 'dining', icon: 'fa-glass-martini' },
    { name: 'Room Service', slug: 'room_service', category: 'dining', icon: 'fa-concierge-bell' },
    
    // Room Features
    { name: 'Air Conditioning', slug: 'ac', category: 'room', icon: 'fa-snowflake' },
    { name: 'Balcony', slug: 'balcony', category: 'room', icon: 'fa-door-open' },
    { name: 'Bathtub', slug: 'bathtub', category: 'room', icon: 'fa-bath' },
    { name: 'TV', slug: 'tv', category: 'room', icon: 'fa-tv' },
    { name: 'Mini Bar', slug: 'mini_bar', category: 'room', icon: 'fa-wine-bottle' },
    
    // Safety
    { name: '24/7 Security', slug: 'security', category: 'safety', icon: 'fa-shield-alt' },
    { name: 'CCTV', slug: 'cctv', category: 'safety', icon: 'fa-video' },
    { name: 'Fire Extinguisher', slug: 'fire_extinguisher', category: 'safety', icon: 'fa-fire-extinguisher' }
  ];

  // 3. Insert
  await knex('amenities').insert(amenities);
  
  console.log('✅ Amenities Seeded Successfully');
};