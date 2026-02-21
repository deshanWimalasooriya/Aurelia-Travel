const knex = require('../../config/db');

exports.getChatHistory = (userId) => {
    return knex('chat_messages')
        .where({ user_id: userId })
        .orderBy('created_at', 'asc');
};

exports.getActiveChats = () => {
    // Safely fetches the most recent message per user using a LEFT JOIN
    // This perfectly bypasses MySQL's ONLY_FULL_GROUP_BY strict mode errors
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
            'c1.is_read'
        )
        .orderBy('c1.created_at', 'desc');
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