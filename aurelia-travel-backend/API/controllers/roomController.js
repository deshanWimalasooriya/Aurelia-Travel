const roomModel = require('../models/roomModel');

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await roomModel.getAllRooms();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message})
    }
};

exports.getRoomById = async (req, res) => {
    try {
        const room = await roomModel.getRoomById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json(room);
    } catch (err) {
        res.status(500).json({ error: err.message})
    }
};

exports.createRoom = async (req, res) => {
    try {
        const newRoom = await roomModel.createRoom(req.body);
        res.status(201).json(newRoom);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const updated = await roomModel.updateRoom(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: 'Room not found' });
        res.json({ message: 'Room updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const deleted = await roomModel.deleteRoom(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Room not found' });
        res.json({ message: 'Room deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRoomsByHotelId = async (req, res) => {
    try {
        const rooms = await roomModel.getRoomsByHotelId(req.params.hotelId);
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

};