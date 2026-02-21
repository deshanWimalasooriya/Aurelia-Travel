import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { 
    Inbox, MailOpen, Mail, Trash2, ArrowLeft, RefreshCw, 
    Search, Reply, Info
} from 'lucide-react';
import './styles/super-messages.css';

const SuperMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'unread', 'read'
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/platform/messages');
            if (res.data.success) setMessages(res.data.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    // --- Derived Data & Formatting ---
    const unreadCount = messages.filter(m => m.status === 'unread').length;
    const displayCount = unreadCount > 99 ? '99+' : unreadCount;

    const filteredMessages = useMemo(() => {
        if (activeTab === 'unread') return messages.filter(m => m.status === 'unread');
        if (activeTab === 'read') return messages.filter(m => m.status === 'read');
        return messages; // 'inbox' shows all
    }, [messages, activeTab]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // --- Actions ---
    const handleOpenMessage = async (msg) => {
        setSelectedMessage(msg);
        // Automatically mark as read if it's unread
        if (msg.status === 'unread') {
            try {
                await api.put(`/platform/messages/${msg.id}/read`);
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
            } catch (err) { console.error(err); }
        }
    };

    const handleBackToList = () => {
        setSelectedMessage(null);
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation(); // Prevent opening the message
        if (!window.confirm("Delete this message?")) return;
        try {
            await api.delete(`/platform/messages/${id}`);
            setMessages(prev => prev.filter(m => m.id !== id));
            if (selectedMessage?.id === id) setSelectedMessage(null);
        } catch (err) { alert("Failed to delete"); }
    };

    const handleMarkRead = async (id, e) => {
        e?.stopPropagation();
        try {
            await api.put(`/platform/messages/${id}/read`);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m));
        } catch (err) { alert("Failed to update"); }
    };

    // Bulk Checkbox Logic
    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(filteredMessages.map(m => m.id));
        else setSelectedIds([]);
    };

    const toggleSelect = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} messages?`)) return;
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/platform/messages/${id}`)));
            setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
            setSelectedIds([]);
        } catch (err) { alert("Some messages failed to delete."); fetchMessages(); }
    };

    return (
        <div style={{ padding: '0 20px 20px 0', height: '100%' }}>
            
            {/* Component Header */}
            <div style={{ marginBottom: '20px' }}>
                <h1 className="sa-page-title" style={{ marginBottom: '5px' }}>Support Inbox</h1>
                <p className="sa-page-subtitle" style={{ margin: 0 }}>Direct inquiries from the public Contact page.</p>
            </div>

            <div className="sm-container">
                {/* --- SIDEBAR --- */}
                <div className="sm-sidebar">
                    <button className="sm-compose-btn" onClick={() => window.open('mailto:?subject=Aurelia Travel Support')}>
                        <Reply size={18} /> Compose Reply
                    </button>

                    <div className="sm-nav-list">
                        <button className={`sm-nav-item ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => { setActiveTab('inbox'); setSelectedMessage(null); }}>
                            <div className="sm-nav-left"><Inbox size={18} /> Inbox</div>
                            {unreadCount > 0 && <span className="sm-badge">{displayCount}</span>}
                        </button>
                        <button className={`sm-nav-item ${activeTab === 'unread' ? 'active' : ''}`} onClick={() => { setActiveTab('unread'); setSelectedMessage(null); }}>
                            <div className="sm-nav-left"><Mail size={18} /> Unread</div>
                        </button>
                        <button className={`sm-nav-item ${activeTab === 'read' ? 'active' : ''}`} onClick={() => { setActiveTab('read'); setSelectedMessage(null); }}>
                            <div className="sm-nav-left"><MailOpen size={18} /> Read</div>
                        </button>
                    </div>
                </div>

                {/* --- MAIN AREA --- */}
                {selectedMessage ? (
                    // READING PANE
                    <div className="sm-reading-pane fade-in">
                        <div className="sm-toolbar">
                            <button className="sm-icon-btn" onClick={handleBackToList} title="Back to Inbox"><ArrowLeft size={20}/></button>
                            <div style={{width: '1px', height: '24px', background: '#e2e8f0', margin: '0 10px'}}></div>
                            <button className="sm-icon-btn" onClick={(e) => handleDelete(selectedMessage.id, e)} title="Delete"><Trash2 size={18}/></button>
                        </div>
                        
                        <div className="sm-read-header">
                            <h2 className="sm-read-title">New Inquiry: Support Request</h2>
                            <div className="sm-read-sender-info">
                                <div className="sm-read-avatar">{selectedMessage.name.charAt(0).toUpperCase()}</div>
                                <div className="sm-read-details">
                                    <div className="sm-read-name">
                                        {selectedMessage.name} 
                                        <span className="sm-read-email">&lt;{selectedMessage.email}&gt;</span>
                                    </div>
                                    <div className="sm-read-time">to Aurelia Support • {new Date(selectedMessage.created_at).toLocaleString()}</div>
                                </div>
                                <a href={`mailto:${selectedMessage.email}`} className="btn-ghost" style={{textDecoration: 'none', padding: '8px 16px'}}>
                                    <Reply size={16}/> Reply
                                </a>
                            </div>
                        </div>

                        <div className="sm-read-body">
                            {selectedMessage.message}
                        </div>
                    </div>
                ) : (
                    // LIST VIEW
                    <div className="sm-main">
                        <div className="sm-toolbar">
                            <div className="sm-row-checkbox" style={{margin: 0}}>
                                <input 
                                    type="checkbox" 
                                    checked={filteredMessages.length > 0 && selectedIds.length === filteredMessages.length}
                                    onChange={toggleSelectAll} 
                                />
                            </div>
                            <button className="sm-icon-btn" onClick={fetchMessages} title="Refresh"><RefreshCw size={18} className={loading ? "animate-spin" : ""}/></button>
                            
                            {selectedIds.length > 0 && (
                                <>
                                    <div style={{width: '1px', height: '24px', background: '#e2e8f0', margin: '0 10px'}}></div>
                                    <button className="sm-icon-btn" onClick={handleBulkDelete} title="Delete Selected"><Trash2 size={18}/></button>
                                </>
                            )}
                        </div>

                        <div className="sm-list-container">
                            {loading ? (
                                <div className="sm-empty-state">Loading messages...</div>
                            ) : filteredMessages.length === 0 ? (
                                <div className="sm-empty-state">
                                    <Inbox size={48} />
                                    <p style={{fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-dark)'}}>Your inbox is empty.</p>
                                    <p>No {activeTab !== 'inbox' ? activeTab : ''} messages to display.</p>
                                </div>
                            ) : (
                                filteredMessages.map(msg => (
                                    <div key={msg.id} className={`sm-row ${msg.status === 'unread' ? 'unread' : ''}`} onClick={() => handleOpenMessage(msg)}>
                                        
                                        <div className="sm-row-checkbox">
                                            <input type="checkbox" checked={selectedIds.includes(msg.id)} onChange={(e) => toggleSelect(msg.id, e)} onClick={e => e.stopPropagation()} />
                                        </div>
                                        
                                        <div className="sm-sender">{msg.name}</div>
                                        
                                        <div className="sm-snippet">
                                            <span className="sm-subject">Website Inquiry</span>
                                            <span className="sm-body-preview">- {msg.message.substring(0, 80)}...</span>
                                        </div>
                                        
                                        <div className="sm-date">{formatTime(msg.created_at)}</div>

                                        {/* Hover Actions */}
                                        <div className="sm-row-actions">
                                            {msg.status === 'unread' && (
                                                <button className="sm-icon-btn" onClick={(e) => handleMarkRead(msg.id, e)} title="Mark as read"><MailOpen size={16}/></button>
                                            )}
                                            <button className="sm-icon-btn" onClick={(e) => handleDelete(msg.id, e)} title="Delete"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperMessages;