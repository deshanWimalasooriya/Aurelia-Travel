const knex = require('../../config/knex')

//Get all rooms
exports.getAllRooms = async () => await knex('rooms').select('*');
exports.getRoomById = (id) => knex('rooms').where({ id }).first();
exports.createRoom = async (room) => {
  const [newRoom] = await knex('rooms')
    .insert(room)
    .returning(['id', 'name', 'type', 'price', 'created_at', 'updated_at']);
  return newRoom;
};
exports.updateRoom = (id, room) => knex('rooms').where({ id }).update(room);
exports.deleteRoom = (id) => knex('rooms').where({ id }).del();

exports.getRoomsByHotelId = (hotelId) => knex('rooms').where({ hotel_id: hotelId });

// Backend/models/roomModel.js
exports.findById = async (id) => {
  return await knex('rooms')
    .select('*')
    .where({ id })
    .first();
}
