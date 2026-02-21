const chatModel = require('../models/chatModel');
const userModel = require('../models/userModel');
const { emitToUser } = require('../socket'); // We will add this next

exports.getHistory = async (req, res) => {
    try {
        const targetUserId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user.userId;
        const messages = await chatModel.getChatHistory(targetUserId);
        
        await chatModel.markAsRead(targetUserId, req.user.role === 'admin' ? 'admin' : 'user');
        res.json({ success: true, data: messages });
    } catch(err) { res.status(500).json({ error: err.message }); }
};

exports.getActiveChats = async (req, res) => {
    try {
        const chats = await chatModel.getActiveChats();
        res.json({ success: true, data: chats });
    } catch(err) { res.status(500).json({ error: err.message }); }
};

exports.sendMessage = async (req, res) => {
    try {
        const { message, receiverId } = req.body;
        const senderType = req.user.role === 'admin' ? 'admin' : 'user';
        const targetUserId = senderType === 'admin' ? receiverId : req.user.userId;

        const newMsg = await chatModel.saveMessage({
            user_id: targetUserId,
            sender: senderType,
            message
        });

        // Broadcast real-time Socket event
        if (senderType === 'admin') {
            emitToUser(targetUserId, 'chat_message', newMsg);
        } else {
            const admins = await userModel.getAdmins();
            admins.forEach(admin => emitToUser(admin.id, 'chat_message', newMsg));
        }

        res.json({ success: true, data: newMsg });
    } catch(err) { res.status(500).json({ error: err.message }); }
};