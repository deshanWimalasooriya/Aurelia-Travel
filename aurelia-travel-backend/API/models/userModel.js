const knex = require('../../config/knex');

// 1. STANDARD CRUD
exports.getAllUsers = () => knex('users').where('is_active', true).select('id', 'username', 'email', 'role', 'is_active');

exports.findById = (id) => knex('users').where({ id }).first();
exports.findByEmail = (email) => knex('users').where({ email }).first();

// Alias for backward compatibility
exports.getUserById = exports.findById;
exports.getUserByEmail = exports.findByEmail;

exports.create = async (userData) => {
    const [id] = await knex('users').insert(userData);
    return exports.findById(id);
};
// Alias
exports.createUser = exports.create;

exports.update = async (id, data) => {
    await knex('users').where({ id }).update(data);
    return exports.findById(id);
};
// Alias
exports.updateUser = exports.update;

// 2. SECURITY: Soft Delete instead of permanent delete
exports.softDelete = (id) => {
    return knex('users').where({ id }).update({ 
        is_active: false,
        deleted_at: knex.fn.now() 
    });
};
// Alias for your existing deleteUser (updated to soft delete)
exports.deleteUser = exports.softDelete;

// 3. CRM LOGIC (Preserved & Optimized)
exports.getCustomersByManagerId = (managerId) => {
    return knex('users')
        .join('bookings', 'users.id', 'bookings.user_id')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .select(
            'users.id',
            'users.username',
            'users.email',
            'users.profile_image',
            'users.city',
            'users.country'
        )
        .count('bookings.id as total_bookings')
        .sum('bookings.total_price as total_spent')
        .max('bookings.check_in as last_visit')
        .where('hotels.manager_id', managerId)
        .groupBy('users.id')
        .orderBy('total_spent', 'desc');
};