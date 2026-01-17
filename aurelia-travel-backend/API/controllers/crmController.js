const complaintModel = require('../models/complaintModel');
const hotelModel = require('../models/hotelModel');

// 1. USER: Create Complaint/Suggestion
exports.createTicket = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { hotel_id, type, subject, description, booking_id } = req.body;

        if (!hotel_id || !subject || !type) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newTicket = await complaintModel.create({
            user_id: userId,
            hotel_id,
            booking_id: booking_id || null, // Optional
            type, // 'complaint', 'suggestion', 'inquiry'
            subject,
            description,
            priority: 'normal'
        });

        res.status(201).json({ success: true, message: "Ticket created", data: newTicket });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. USER: Get My History
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await complaintModel.findByUserId(req.user.userId);
        res.json({ success: true, data: tickets });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. MANAGER: Get Hotel Complaints
exports.getManagerTickets = async (req, res) => {
    try {
        const tickets = await complaintModel.findByManagerId(req.user.userId);
        res.json({ success: true, data: tickets });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. MANAGER: Resolve Ticket
exports.resolveTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution_notes } = req.body; // status: 'in_progress' or 'resolved'

        // Security: Ensure Manager owns the hotel associated with this ticket
        const ticket = await complaintModel.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        const hotel = await hotelModel.getById(ticket.hotel_id);
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        await complaintModel.updateStatus(id, status, resolution_notes);
        res.json({ success: true, message: `Ticket marked as ${status}` });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};