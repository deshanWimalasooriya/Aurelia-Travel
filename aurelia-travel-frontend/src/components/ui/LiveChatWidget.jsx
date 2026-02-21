import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { X, MessageCircle, Send, Paperclip, CheckCheck } from 'lucide-react';
import { io } from "socket.io-client";
import './styles/LiveChatWidget.css';

const LiveChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0); // ✅ Track unread messages
    const [socket, setSocket] = useState(null);
    
    const messagesEndRef = useRef(null);
    const isOpenRef = useRef(isOpen);

    useEffect(() => {
        api.get('/chat/unread-count').then(res => {
            if (res.data.success) setUnreadCount(res.data.count);
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        isOpenRef.current = isOpen;
        
        // Fetch full history EVERY time they open it to ensure it is 100% synced
        if (isOpen) {
            api.get('/chat').then(res => {
                if (res.data.success) {
                    setMessages(res.data.data);
                    setUnreadCount(0); // Clear badge
                }
            }).catch(err => console.error(err));
        }
    }, [isOpen]);

    // Socket Setup - Runs ONCE perfectly
    useEffect(() => {
        const newSocket = io("http://localhost:5000", { 
            withCredentials: true, 
            transports: ['websocket', 'polling'] 
        });
        setSocket(newSocket);

        newSocket.on("chat_message", (msg) => {
            setMessages(prev => [...prev, msg]);
            // ✅ Trigger Unread Badge if widget is closed
            if (!isOpenRef.current) {
                setUnreadCount(prev => prev + 1);
            }
        });

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const optimisticMsg = { id: Date.now(), message: newMessage, sender: 'user', created_at: new Date() };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage("");

        try {
            const res = await api.post('/chat', { message: optimisticMsg.message });
            if (res.data.success) {
                setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? res.data.data : m));
            }
        } catch (err) { console.error("Failed to send message", err); }
    };

    return (
        <>
            {/* The Floating Button */}
            {!isOpen && (
                <button className="lc-floating-btn" onClick={() => setIsOpen(true)}>
                    <MessageCircle size={28} />
                    {/* ✅ DYNAMIC 99+ UNREAD NOTIFICATION BADGE */}
                    {unreadCount > 0 && <span className="lc-unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
            )}

            {/* The Chat Window */}
            {isOpen && (
                <div className="lc-widget-container fade-in">
                    <div className="lc-header">
                        <div className="lc-header-info">
                            <div className="lc-avatar"><span className="online-dot"></span>A</div>
                            <div>
                                <h4>Aurelia Support</h4>
                                <p>We typically reply in minutes</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="lc-close"><X size={18}/></button>
                    </div>
                    
                    <div className="lc-body">
                        <div className="lc-welcome-msg">Chat with an Admin. How can we help?</div>
                        {messages.map(msg => (
                            <div key={msg.id} className={`lc-bubble-wrapper ${msg.sender === 'admin' ? 'support' : 'me'}`}>
                                <div className="lc-bubble">{msg.message}</div>
                                <span className="lc-time">
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    {msg.sender === 'user' && <CheckCheck size={12} color="#10b981"/>}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="lc-footer">
                        <button type="button" className="lc-attach"><Paperclip size={18}/></button>
                        <input type="text" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                        <button type="submit" className="lc-send" disabled={!newMessage.trim()}><Send size={16}/></button>
                    </form>
                </div>
            )}
        </>
    );
};

export default LiveChatWidget;