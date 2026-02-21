import { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    Inbox, MailOpen, Trash2, ArrowLeft, RefreshCw, Reply
} from 'lucide-react';
import './styles/super-messages.css';

const SuperMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
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
        if (msg.status === 'unread') {
            try {
                await api.put(`/platform/messages/${msg.id}/read`);
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
            } catch (err) { console.error(err); }
        }
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation(); 
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

    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(messages.map(m => m.id));
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
            
            <div style={{ marginBottom: '20px' }}>
                <h1 className="sa-page-title" style={{ marginBottom: '5px' }}>Support Inbox</h1>
                <p className="sa-page-subtitle" style={{ margin: 0 }}>Direct inquiries from the public Contact page.</p>
            </div>

            <div className="sm-container">
                {selectedMessage ? (
                    // --- FULL WIDTH READING PANE ---
                    <div className="sm-reading-pane fade-in">
                        <div className="sm-toolbar">
                            <button className="sm-icon-btn" onClick={() => setSelectedMessage(null)} title="Back to Inbox">
                                <ArrowLeft size={20}/>
                            </button>
                            <div style={{width: '1px', height: '24px', background: '#e2e8f0', margin: '0 10px'}}></div>
                            <button className="sm-icon-btn" onClick={(e) => handleDelete(selectedMessage.id, e)} title="Delete">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                        
                        <div className="sm-read-header">
                            <h2 className="sm-read-title">Website Inquiry</h2>
                            <div className="sm-read-sender-info">
                                <div className="sm-read-avatar">{selectedMessage.name.charAt(0).toUpperCase()}</div>
                                <div className="sm-read-details">
                                    <div className="sm-read-name">
                                        {selectedMessage.name} 
                                        <span className="sm-read-email">&lt;{selectedMessage.email}&gt;</span>
                                    </div>
                                    <div className="sm-read-time">to Aurelia Support • {new Date(selectedMessage.created_at).toLocaleString()}</div>
                                </div>
                                <a href={`mailto:${selectedMessage.email}`} className="btn-ghost" style={{textDecoration: 'none', padding: '10px 20px'}}>
                                    <Reply size={16}/> Reply
                                </a>
                            </div>
                        </div>

                        <div className="sm-read-body">
                            {selectedMessage.message}
                        </div>
                    </div>
                ) : (
                    // --- FULL WIDTH LIST VIEW ---
                    <div className="sm-main fade-in">
                        <div className="sm-toolbar">
                            <div className="sm-row-checkbox" style={{margin: 0}}>
                                <input 
                                    type="checkbox" 
                                    checked={messages.length > 0 && selectedIds.length === messages.length}
                                    onChange={toggleSelectAll} 
                                />
                            </div>
                            <button className="sm-icon-btn" onClick={fetchMessages} title="Refresh">
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""}/>
                            </button>
                            
                            {selectedIds.length > 0 && (
                                <>
                                    <div style={{width: '1px', height: '24px', background: '#e2e8f0', margin: '0 10px'}}></div>
                                    <button className="sm-icon-btn" onClick={handleBulkDelete} title="Delete Selected">
                                        <Trash2 size={18}/>
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="sm-list-container">
                            {loading ? (
                                <div className="sm-empty-state">Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="sm-empty-state">
                                    <Inbox size={48} />
                                    <p style={{fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-dark)', margin: '15px 0 5px'}}>Your inbox is empty.</p>
                                    <p>You have no new messages.</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className={`sm-row ${msg.status === 'unread' ? 'unread' : ''}`} onClick={() => handleOpenMessage(msg)}>
                                        
                                        <div className="sm-row-checkbox">
                                            <input type="checkbox" checked={selectedIds.includes(msg.id)} onChange={(e) => toggleSelect(msg.id, e)} onClick={e => e.stopPropagation()} />
                                        </div>
                                        
                                        <div className="sm-sender">{msg.name}</div>
                                        
                                        <div className="sm-snippet">
                                            <span className="sm-subject">Support Request</span>
                                            <span className="sm-body-preview">- {msg.message.substring(0, 100)}...</span>
                                        </div>
                                        
                                        <div className="sm-date">{formatTime(msg.created_at)}</div>

                                        {/* Hover Actions */}
                                        <div className="sm-row-actions">
                                            {msg.status === 'unread' && (
                                                <button className="sm-icon-btn" onClick={(e) => handleMarkRead(msg.id, e)} title="Mark as read">
                                                    <MailOpen size={16}/>
                                                </button>
                                            )}
                                            <button className="sm-icon-btn" onClick={(e) => handleDelete(msg.id, e)} title="Delete">
                                                <Trash2 size={16}/>
                                            </button>
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