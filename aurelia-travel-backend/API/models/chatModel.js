const knex = require('../../config/db');

exports.getChatHistory = (userId) => {
    return knex('chat_messages')
        .where({ user_id: userId })
        .orderBy('created_at', 'asc');
};

exports.getActiveChats = () => {
    return knex('chat_messages as c1')
        .join('users', 'c1.user_id', 'users.id')
        .leftJoin('chat_messages as c2', function() {
            this.on('c1.user_id', '=', 'c2.user_id').andOn('c1.id', '<', 'c2.id');
        })
        .whereNull('c2.id')
        .select(
            'users.id as user_id', 
            'users.username', 
            'users.profile_image', 
            'users.role',
            'c1.message', 
            'c1.created_at', 
            // ✅ Dynamically count unread messages per user for the Admin's sidebar
            knex.raw(`(SELECT COUNT(*) FROM chat_messages WHERE user_id = users.id AND sender = 'user' AND is_read = false) as unread_count`)
        )
        .orderBy('c1.created_at', 'desc');
};

// ✅ NEW: Get total unread count for the Layout Badges
exports.getUnreadCount = (userId, role) => {
    if (role === 'admin') {
        // Admin wants to know how many unread messages exist from ALL users
        return knex('chat_messages').where({ sender: 'user', is_read: false }).count('id as count').first();
    } else {
        // Manager/User wants to know how many unread messages they have from the Admin
        return knex('chat_messages').where({ user_id: userId, sender: 'admin', is_read: false }).count('id as count').first();
    }
};

exports.saveMessage = async (data) => {
    const [id] = await knex('chat_messages').insert(data);
    return knex('chat_messages').where({ id }).first();
};

exports.markAsRead = (userId, readerType) => {
    const senderToMark = readerType === 'admin' ? 'user' : 'admin';
    return knex('chat_messages')
        .where({ user_id: userId, sender: senderToMark })
        .update({ is_read: true });
};