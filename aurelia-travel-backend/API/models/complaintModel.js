const knex = require('../../config/knex');

// Helper: Generate Ticket Number (e.g., TKT-2026-992)
const generateTicketNumber = () => {
    return `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// 1. CREATE TICKET
exports.create = async (data) => {
    const ticketNum = generateTicketNumber();
    const [id] = await knex('complaints_suggestions').insert({
        ...data,
        ticket_number: ticketNum,
        status: 'open',
        created_at: knex.fn.now()
    });
    return knex('complaints_suggestions').where({ id }).first();
};

// 2. GET MY TICKETS (User)
exports.findByUserId = (userId) => {
    return knex('complaints_suggestions')
        .join('hotels', 'complaints_suggestions.hotel_id', 'hotels.id')
        .select('complaints_suggestions.*', 'hotels.name as hotel_name')
        .where('complaints_suggestions.user_id', userId)
        .orderBy('created_at', 'desc');
};

// 3. GET HOTEL TICKETS (Manager)
exports.findByManagerId = (managerId) => {
    return knex('complaints_suggestions')
        .join('hotels', 'complaints_suggestions.hotel_id', 'hotels.id')
        .join('users', 'complaints_suggestions.user_id', 'users.id')
        .select(
            'complaints_suggestions.*', 
            'hotels.name as hotel_name',
            'users.username as user_name',
            'users.email as user_email'
        )
        .where('hotels.manager_id', managerId)
        .orderBy('status', 'asc'); // Open tickets first
};

// 4. RESOLVE TICKET
exports.updateStatus = (id, status, resolution_notes) => {
    return knex('complaints_suggestions')
        .where({ id })
        .update({ 
            status, 
            resolution_notes,
            resolved_at: status === 'resolved' ? knex.fn.now() : null
        });
};

// 5. FIND BY ID
exports.findById = (id) => knex('complaints_suggestions').where({ id }).first();