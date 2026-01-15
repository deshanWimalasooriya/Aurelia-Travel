/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🌱 Seeding Bookings...');

  // 1. Clear existing bookings
  await knex('bookings').del();

  // 2. Fetch dependencies (We need a valid User and valid Rooms)
  const users = await knex('users').select('id', 'username');
  const rooms = await knex('rooms').select('id', 'hotel_id', 'price_per_night', 'title');

  if (users.length === 0 || rooms.length === 0) {
      console.log('⚠️ SKIPPING BOOKINGS: No users or rooms found to link.');
      return;
  }

  const user = users[0]; // Pick the first user
  
  // Pick two different rooms
  const room1 = rooms[0];
  const room2 = rooms.length > 1 ? rooms[1] : rooms[0];

  // 3. Create Bookings
  await knex('bookings').insert([
    {
      user_id: user.id,
      hotel_id: room1.hotel_id,
      room_id: room1.id,
      check_in: '2026-04-10',
      check_out: '2026-04-15', // 5 nights
      adults: 2,
      children: 0,
      total_price: (room1.price_per_night * 5).toFixed(2), // Calculate total
      status: 'confirmed'
    },
    {
      user_id: user.id,
      hotel_id: room2.hotel_id,
      room_id: room2.id,
      check_in: '2026-05-20',
      check_out: '2026-05-22', // 2 nights
      adults: 1,
      children: 0,
      total_price: (room2.price_per_night * 2).toFixed(2),
      status: 'pending'
    }
  ]);

  console.log(`✅ Created bookings for user: ${user.username}`);
};