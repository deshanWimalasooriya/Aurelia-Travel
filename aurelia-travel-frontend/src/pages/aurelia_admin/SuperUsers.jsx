import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Trash2, ShieldBan, CheckCircle, Plus, X, Edit2, Save, Eye, Loader2, Smartphone, Building, Bed, ChevronDown, ChevronUp } from 'lucide-react';
import './styles/super-users.css';

const SuperUsers = () => {
    // Data State
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('all');

    // Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Manager View States (Hotels & Rooms)
    const [managerHotels, setManagerHotels] = useState([]);
    const [loadingHotels, setLoadingHotels] = useState(false);
    const [expandedHotelId, setExpandedHotelId] = useState(null);
    const [hotelRooms, setHotelRooms] = useState({});
    const [loadingRooms, setLoadingRooms] = useState({});

    // OTP Security State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpStep, setOtpStep] = useState('request');
    const [otpInput, setOtpInput] = useState('');
    const [isOtpLoading, setIsOtpLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        id: null, username: '', email: '', password: '', role: 'user', 
        first_name: '', last_name: '', phone: '', bio: ''
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users'); 
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setUsers(data);
        } catch (err) { 
            console.error("Failed to load users:", err); 
            setUsers([]);
        } finally { 
            setLoading(false); 
        }
    };

    const fetchManagerHotels = async (managerId) => {
        setLoadingHotels(true);
        try {
            const res = await api.get(`/hotels/manager/${managerId}`);
            if (res.data.success) {
                setManagerHotels(res.data.data);
            } else {
                setManagerHotels([]);
            }
        } catch (err) {
            console.error("Failed to load manager hotels", err);
            setManagerHotels([]);
        } finally {
            setLoadingHotels(false);
        }
    };

    const toggleHotelRooms = async (hotelId) => {
        if (expandedHotelId === hotelId) {
            setExpandedHotelId(null);
            return;
        }

        setExpandedHotelId(hotelId);

        if (!hotelRooms[hotelId]) {
            setLoadingRooms(prev => ({ ...prev, [hotelId]: true }));
            try {
                const res = await api.get(`/rooms/hotel/${hotelId}`);
                if (res.data.success) {
                    setHotelRooms(prev => ({ ...prev, [hotelId]: res.data.data }));
                }
            } catch (err) {
                console.error("Failed to load rooms", err);
            } finally {
                setLoadingRooms(prev => ({ ...prev, [hotelId]: false }));
            }
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        const payload = { ...formData };
        if (isEditing && !payload.password) delete payload.password; 

        if (isEditing) {
            setPendingAction({ type: 'UPDATE', payload });
            setOtpStep('request');
            setOtpInput('');
            setShowOtpModal(true);
        } else {
            try {
                await api.post('/users', payload); 
                alert("User created successfully!");
                setShowEditModal(false);
                loadUsers(); 
            } catch (err) {
                alert("Create failed: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleDelete = (id) => {
        setPendingAction({ type: 'DELETE', id });
        setOtpStep('request');
        setOtpInput('');
        setShowOtpModal(true);
    };

    const handleToggleBan = async (user) => {
        const newStatus = !user.is_active;
        if (!window.confirm(`Are you sure you want to ${newStatus ? "Activate" : "Ban"} this user?`)) return;
        try {
            await api.put(`/users/${user.id}`, { is_active: newStatus });
            loadUsers();
        } catch (err) { alert(`Failed to update status.`); }
    };

    const requestOtp = () => {
        setIsOtpLoading(true);
        setTimeout(() => { setIsOtpLoading(false); setOtpStep('verify'); alert("SECURITY: Your OTP is 123456"); }, 1500);
    };

    const verifyAndExecute = async (e) => {
        e.preventDefault();
        if (otpInput !== '123456') { alert("Invalid OTP."); return; }
        setIsOtpLoading(true);
        try {
            if (pendingAction.type === 'DELETE') {
                await api.delete(`/users/${pendingAction.id}`);
                alert("User deleted.");
            } else if (pendingAction.type === 'UPDATE') {
                await api.put(`/users/${pendingAction.payload.id}`, pendingAction.payload);
                alert("User updated.");
                setShowEditModal(false);
            }
            setShowOtpModal(false);
            setPendingAction(null);
            loadUsers();
        } catch (err) { alert("Operation failed."); } 
        finally { setIsOtpLoading(false); }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData({ id: null, username: '', email: '', password: '', role: 'user', first_name: '', last_name: '', phone: '', bio: '' });
        setShowEditModal(true);
    };

    const openEditModal = (user) => {
        setIsEditing(true);
        setFormData({
            id: user.id, username: user.username || '', email: user.email || '', password: '', 
            role: user.role || 'user', first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '', bio: user.bio || ''
        });
        setShowEditModal(true);
    };

    const openViewModal = (user) => {
        setSelectedUser(user);
        setShowViewModal(true);
        setManagerHotels([]); 
        setHotelRooms({});
        setExpandedHotelId(null);
        
        if (user.role === 'hotel_manager') {
            fetchManagerHotels(user.id);
        }
    };

    const filtered = users.filter(u => {
        const matchesSearch = (u.username && u.username.toLowerCase().includes(search.toLowerCase())) || (u.email && u.email.toLowerCase().includes(search.toLowerCase()));
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div style={{position: 'relative'}}>
            {/* Header */}
            <div className="sa-header-row">
                <div>
                    <h1 className="sa-page-title">User Base</h1>
                    <p style={{margin:0, color:'var(--text-muted)', fontSize:'0.9rem'}}>Manage travelers, partners, and admins</p>
                </div>
                <button className="sa-btn-create" onClick={openCreateModal}><Plus size={18} /> Add User</button>
            </div>

            {/* Tabs */}
            <div className="sa-tabs-container">
                {['all', 'hotel_manager', 'user', 'admin'].map(role => (
                    <button key={role} className={`sa-tab ${roleFilter === role ? 'active' : ''}`} onClick={() => setRoleFilter(role)}>
                        {role === 'all' ? 'All Users' : (role === 'user' ? 'Travelers' : role.replace('_', ' '))}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="sa-table-controls" style={{marginBottom:'15px'}}>
                <div className="sa-search-wrapper" style={{width: '100%'}}>
                    <Search size={18} className="sa-search-icon"/>
                    <input className="sa-search-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
            </div>

            {/* Table */}
            <div className="sa-table-card">
                <table className="sa-table">
                    <thead><tr><th>User Profile</th><th>Role</th><th>Status</th><th style={{textAlign: 'right'}}>Actions</th></tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan="4" style={{textAlign:'center', padding:'40px'}}><Loader2 className="animate-spin mx-auto" color="var(--text-muted)"/></td></tr> : filtered.length > 0 ? (
                            filtered.map(user => (
                                <tr key={user.id} style={{ opacity: user.is_active ? 1 : 0.6 }}>
                                    <td>
                                        <div className="sa-user-cell">
                                            <div className="sa-user-avatar">{user.profile_image ? <img src={user.profile_image} alt=""/> : <User size={20}/>}</div>
                                            <div><div className="sa-user-name">{user.username}</div><div className="sa-user-email">{user.email}</div></div>
                                        </div>
                                    </td>
                                    <td><span className={`sa-role-badge sa-role-${user.role}`}>{user.role.replace('_', ' ')}</span></td>
                                    <td>{user.is_active ? <span className="sa-status-text sa-text-active"><CheckCircle size={14}/> Active</span> : <span className="sa-status-text sa-text-banned"><ShieldBan size={14}/> Banned</span>}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="sa-action-group">
                                            <button className="sa-action-btn" title="View Profile" onClick={() => openViewModal(user)}><Eye size={18} color="var(--text-secondary)"/></button>
                                            <button className="sa-action-btn" title="Edit User" onClick={() => openEditModal(user)}><Edit2 size={18} color="var(--color-primary)"/></button>
                                            <button className="sa-action-btn" title={user.is_active ? "Ban User" : "Activate User"} onClick={() => handleToggleBan(user)}><ShieldBan size={18} color={user.is_active ? "#f59e0b" : "#10b981"}/></button>
                                            <button className="sa-action-btn delete" title="Delete User" onClick={() => handleDelete(user.id)}><Trash2 size={18} color="#ef4444"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color: 'var(--text-muted)'}}>No users found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* VIEW DETAILS MODAL */}
            <AnimatePresence>
            {showViewModal && selectedUser && (
                <motion.div className="sa-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowViewModal(false)}>
                    <motion.div className={`sa-modal-content ${selectedUser.role === 'hotel_manager' ? 'wide-modal' : ''}`} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                        <div className="sa-modal-header"><h3>User Details</h3><button onClick={() => setShowViewModal(false)} className="sa-btn-close"><X size={20}/></button></div>
                        <div className="sa-modal-body">
                            <div className="user-profile-header">
                                <div className="large-avatar">{selectedUser.profile_image ? <img src={selectedUser.profile_image} alt=""/> : <User size={40}/>}</div>
                                <div><h2 style={{margin:'0 0 5px', color:'var(--color-dark)', fontSize:'1.4rem'}}>{selectedUser.username}</h2><span className={`sa-role-badge sa-role-${selectedUser.role}`}>{selectedUser.role.replace('_', ' ')}</span></div>
                            </div>
                            <div className="detail-grid">
                                <div className="d-item"><label>Full Name</label><p>{selectedUser.first_name} {selectedUser.last_name || '-'}</p></div>
                                <div className="d-item"><label>Email</label><p>{selectedUser.email}</p></div>
                                <div className="d-item"><label>Phone</label><p>{selectedUser.phone || 'N/A'}</p></div>
                                <div className="d-item"><label>Location</label><p>{selectedUser.city || 'N/A'}, {selectedUser.country || ''}</p></div>
                                <div className="d-item full"><label>Bio</label><p style={{fontStyle: 'italic', color: 'var(--text-secondary)'}}>{selectedUser.bio || 'No bio provided.'}</p></div>
                            </div>

                            {/* MANAGER SPECIFIC: HOTELS LIST */}
                            {selectedUser.role === 'hotel_manager' && (
                                <div className="manager-portfolio-section">
                                    <div className="sa-divider"></div>
                                    <h4 className="section-title"><Building size={16}/> Managed Properties</h4>
                                    
                                    {loadingHotels ? (
                                        <div className="loading-state"><Loader2 className="animate-spin" size={20}/> Fetching Properties...</div>
                                    ) : managerHotels.length > 0 ? (
                                        <div className="manager-hotels-list">
                                            {managerHotels.map(hotel => (
                                                <div key={hotel.id} className="manager-hotel-card">
                                                    <div className="mh-header" onClick={() => toggleHotelRooms(hotel.id)}>
                                                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                                                            <div className="mh-icon"><Building size={16}/></div>
                                                            <div>
                                                                <span className="mh-name">{hotel.name}</span>
                                                                <span className={`mh-status ${hotel.is_active ? 'active' : 'inactive'}`}>
                                                                    {hotel.is_active ? 'Active' : 'Hidden'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {expandedHotelId === hotel.id ? <ChevronUp size={18} color="var(--text-muted)"/> : <ChevronDown size={18} color="var(--text-muted)"/>}
                                                    </div>

                                                    {/* NESTED: ROOMS LIST */}
                                                    <AnimatePresence>
                                                    {expandedHotelId === hotel.id && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mh-rooms-container">
                                                            {loadingRooms[hotel.id] ? (
                                                                <div className="loading-sub"><Loader2 size={16} className="animate-spin"/></div>
                                                            ) : (hotelRooms[hotel.id] && hotelRooms[hotel.id].length > 0) ? (
                                                                <table className="mini-rooms-table">
                                                                    <thead><tr><th>Room Type</th><th>Price</th><th>Qty</th></tr></thead>
                                                                    <tbody>
                                                                        {hotelRooms[hotel.id].map(room => (
                                                                            <tr key={room.id}>
                                                                                <td><Bed size={14} style={{marginRight:'6px', color:'var(--text-muted)'}}/> {room.title}</td>
                                                                                <td style={{fontWeight:600}}>${room.base_price_per_night}</td>
                                                                                <td>{room.total_quantity}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            ) : (
                                                                <div className="empty-sub">No rooms found.</div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="empty-state">No properties assigned to this manager.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* EDIT/CREATE MODAL */}
            <AnimatePresence>
            {showEditModal && (
                <motion.div className="sa-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className="sa-modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                        <div className="sa-modal-header"><h3>{isEditing ? 'Edit User' : 'Create New User'}</h3><button onClick={() => setShowEditModal(false)} className="sa-btn-close"><X size={20}/></button></div>
                        <div className="sa-modal-body">
                            <form onSubmit={handleSaveUser} className="sa-modal-form">
                                <div className="form-row"><div className="form-group"><label>First Name</label><input className="sa-input" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div><div className="form-group"><label>Last Name</label><input className="sa-input" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div></div>
                                <div className="form-group"><label>Username <span className="req">*</span></label><input className="sa-input" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                                <div className="form-group"><label>Email <span className="req">*</span></label><input className="sa-input" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                <div className="form-group"><label>Role</label><select className="sa-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="user">Traveler</option><option value="hotel_manager">Hotel Partner</option><option value="admin">System Admin</option></select></div>
                                <div className="form-group"><label>{isEditing ? 'Password (Optional)' : 'Password *'}</label><input className="sa-input" type="password" required={!isEditing} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                                <div className="form-group"><label>Phone</label><input className="sa-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                                <div className="sa-modal-footer"><button type="button" className="btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="btn-primary-compact"><Save size={16}/> {isEditing ? 'Update Profile' : 'Create Profile'}</button></div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* EDIT/CREATE MODAL */}
            <AnimatePresence>
            {showEditModal && (
                <motion.div className="sa-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className="sa-modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
                        
                        <div className="sa-modal-header" style={{ paddingBottom: '20px', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem' }}>{isEditing ? 'Edit User Profile' : 'Create New User'}</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {isEditing ? 'Update user details, roles, and permissions.' : 'Add a new traveler, partner, or admin.'}
                                </p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="sa-btn-close"><X size={20}/></button>
                        </div>

                        <div className="sa-modal-body">
                            <form onSubmit={handleSaveUser} className="premium-form">
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input className="sa-input" placeholder="e.g. John" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input className="sa-input" placeholder="e.g. Doe" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Username <span className="req">*</span></label>
                                        <input className="sa-input" required placeholder="johndoe123" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address <span className="req">*</span></label>
                                        <input className="sa-input" type="email" required placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Platform Role</label>
                                        <select className="sa-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                            <option value="user">Traveler</option>
                                            <option value="hotel_manager">Hotel Partner</option>
                                            <option value="admin">System Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input className="sa-input" placeholder="+1 234 567 8900" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>{isEditing ? 'New Password (Leave blank to keep current)' : 'Account Password *'}</label>
                                    <input className="sa-input" type="password" placeholder="••••••••" required={!isEditing} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                </div>

                                <div className="sa-modal-footer">
                                    <button type="button" className="btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary-compact">
                                        <Save size={18}/> {isEditing ? 'Save Changes' : 'Create User'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};
export default SuperUsers;