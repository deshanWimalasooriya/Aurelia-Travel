const knex = require('../../config/knex');

// Get all rooms
exports.getAllRooms = () => {
  return knex('rooms').select('*');
};

// Get room by ID
exports.getRoomById = (id) => {
  return knex('rooms').where({ id }).first();
};

// Create new room (MySQL Compatible - No .returning)
exports.createRoom = async (roomData) => {
  const [id] = await knex('rooms').insert(roomData);
  return exports.getRoomById(id);
};

// Update room
exports.updateRoom = async (id, roomData) => {
  await knex('rooms').where({ id }).update(roomData);
  return exports.getRoomById(id);
};

// Delete room
exports.deleteRoom = (id) => {
  return knex('rooms').where({ id }).del();
};

// Get rooms by Hotel ID
exports.getRoomsByHotelId = (hotelId) => {
  return knex('rooms').where({ hotel_id: hotelId });
};

// ✅ ADD THIS MISSING FUNCTION
exports.getRoomsByManagerId = (managerId) => {
  return knex('rooms')
    .join('hotels', 'rooms.hotel_id', 'hotels.id') // Join with hotels table
    .where('hotels.manager_id', managerId)         // Filter by the manager's ID
    .select('rooms.*', 'hotels.name as hotel_name'); // Return room data + hotel name
};

// Alias for internal use if needed
exports.findById = exports.getRoomById;