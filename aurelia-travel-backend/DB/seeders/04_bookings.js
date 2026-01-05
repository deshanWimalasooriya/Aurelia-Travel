// seeds/04_bookings.js
exports.seed = async function(knex) {
  await knex('bookings').del();

  // 1. Fetch Users by the EXACT usernames we set in 01_users.js
  const testUser = await knex('users').where('username', 'testuser').first();
  const johnDoe = await knex('users').where('username', 'johndoe').first();

  // 2. Fetch Rooms (Using the names from 03_rooms.js)
  // Note: Ensure your 03_rooms.js actually creates 'Eiffel View Suite'
  const parisRoom = await knex('rooms').where('room_type', 'Eiffel View Suite').first();
  const baliRoom = await knex('rooms').where('room_type', 'Pool Villa').first();

  // Debug: If this prints "false", it means Step 1 didn't run correctly
  if (!testUser || !johnDoe || !parisRoom || !baliRoom) {
    console.error("❌ CRITICAL ERROR: Data missing.");
    console.log("Debug Info:", {
        User_TestUser: !!testUser,
        User_JohnDoe: !!johnDoe,
        Room_Paris: !!parisRoom,
        Room_Bali: !!baliRoom
    });
    return; // Stop here so we don't crash
  }

  // 3. Insert Bookings
  await knex('bookings').insert([
    {
      user_id: testUser.id,
      room_id: baliRoom.id,
      adults: 2,
      children: 1,
      check_in: '2024-06-01',
      check_out: '2024-06-07',
      total_price: 1139.94,
      status: 'confirmed'
    },
    {
      user_id: johnDoe.id,
      room_id: parisRoom.id,
      adults: 1,
      children: 0,
      check_in: '2024-08-10',
      check_out: '2024-08-15',
      total_price: 2250.00,
      status: 'completed'
    }
  ]);
};