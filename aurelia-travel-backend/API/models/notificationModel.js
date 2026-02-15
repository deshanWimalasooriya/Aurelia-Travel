const knex = require('../../config/knex');

// Create a new notification
exports.create = async (data) => {
    return knex('notifications').insert({
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        link: data.link || null,
        is_read: false
    });
};

// Get notifications for a specific user
exports.getByUserId = (userId) => {
    return knex('notifications')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc') // Newest first
        .limit(20); // Limit to 20 to prevent overload
};

// Count unread messages
exports.getUnreadCount = async (userId) => {
    const result = await knex('notifications')
        .where({ user_id: userId, is_read: false })
        .count('id as count')
        .first();
    return result.count;
};

// Mark single as read
exports.markAsRead = (id, userId) => {
    return knex('notifications')
        .where({ id, user_id: userId })
        .update({ is_read: true });
};

// Mark all as read
exports.markAllAsRead = (userId) => {
    return knex('notifications')
        .where({ user_id: userId })
        .update({ is_read: true });
};