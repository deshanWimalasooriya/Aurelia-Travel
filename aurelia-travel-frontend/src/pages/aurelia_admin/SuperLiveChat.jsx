import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { io } from "socket.io-client";
import { Search, Send, User, CheckCheck, MessageCircle } from 'lucide-react';
import './styles/super-live-chat.css';

const SuperLiveChat = () => {
    const [chats, setChats] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [replyText, setReplyText] = useState("");
    const [socket, setSocket] = useState(null);
    
    const messagesEndRef = useRef(null);
    // ✅ FIX: Use a ref so the socket doesn't disconnect when switching users
    const selectedUserRef = useRef(selectedUser);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        fetchActiveChats();
        
        // ✅ Initialize Socket ONCE
        const newSocket = io("http://localhost:5000", { 
            withCredentials: true, 
            transports: ['websocket', 'polling'] 
        });
        setSocket(newSocket);
        
        newSocket.on("chat_message", (msg) => {
            fetchActiveChats(); // Instantly bumps the user to the top of the sidebar
            
            // Only append the message if the admin is currently viewing that exact user
            setMessages(prev => {
                if (selectedUserRef.current && msg.user_id === selectedUserRef.current.user_id) {
                    return [...prev, msg];
                }
                return prev;
            });
        });

        return () => newSocket.disconnect();
    }, []);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchActiveChats = async () => {
        try {
            const res = await api.get('/chat/active');
            if (res.data.success) setChats(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleSelectChat = async (user) => {
        setSelectedUser(user);
        try {
            const res = await api.get(`/chat?userId=${user.user_id}`);
            if (res.data.success) setMessages(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedUser) return;

        const optimisticMsg = { id: Date.now(), message: replyText, sender: 'admin', created_at: new Date() };
        setMessages(prev => [...prev, optimisticMsg]);
        setReplyText("");

        try {
            await api.post('/chat', { message: optimisticMsg.message, receiverId: selectedUser.user_id });
            fetchActiveChats(); 
        } catch (err) { console.error("Send failed", err); }
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)' }}>
            <h1 className="sa-page-title" style={{marginBottom: '5px'}}>Live Support Desk</h1>
            <p className="sa-page-subtitle" style={{marginBottom: '20px'}}>Real-time chat with Hotel Partners & Users.</p>

            <div className="slc-container">
                {/* SIDEBAR: Active Chats */}
                <div className="slc-sidebar">
                    <div className="slc-search-box">
                        <Search size={16} />
                        <input type="text" placeholder="Search conversations..." />
                    </div>
                    <div className="slc-chat-list">
                        {chats.map(chat => (
                            <div key={chat.user_id} className={`slc-chat-item ${selectedUser?.user_id === chat.user_id ? 'active' : ''}`} onClick={() => handleSelectChat(chat)}>
                                <div className="slc-avatar">{chat.profile_image ? <img src={chat.profile_image} alt=""/> : <User size={20}/>}</div>
                                <div className="slc-chat-info">
                                    <div className="slc-chat-header">
                                        <span className="slc-name">{chat.username}</span>
                                        <span className="slc-time">{new Date(chat.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div className="slc-chat-preview">{chat.message}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MAIN: Chat Thread */}
                <div className="slc-main">
                    {selectedUser ? (
                        <>
                            <div className="slc-thread-header">
                                <div className="slc-avatar">{selectedUser.profile_image ? <img src={selectedUser.profile_image} alt=""/> : <User size={24}/>}</div>
                                <div>
                                    <h2>{selectedUser.username}</h2>
                                    <span className="slc-role-badge">{selectedUser.role ? selectedUser.role.replace('_', ' ') : 'User'}</span>
                                </div>
                            </div>
                            
                            <div className="slc-thread-body">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`slc-bubble-wrapper ${msg.sender === 'admin' ? 'me' : 'them'}`}>
                                        <div className="slc-bubble">{msg.message}</div>
                                        <span className="slc-time">
                                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            {msg.sender === 'admin' && <CheckCheck size={14} color="#10b981"/>}
                                        </span>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSendReply} className="slc-thread-footer">
                                <input type="text" placeholder="Type your reply here..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                                <button type="submit" disabled={!replyText.trim()}><Send size={18}/> Send</button>
                            </form>
                        </>
                    ) : (
                        <div className="slc-empty-state">
                            <MessageCircle size={64} />
                            <h3>Select a conversation</h3>
                            <p>Choose a chat from the left to start replying.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperLiveChat;