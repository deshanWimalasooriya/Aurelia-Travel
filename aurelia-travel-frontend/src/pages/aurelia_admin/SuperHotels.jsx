import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Power, Mail, Loader2, Eye, X, Bed, DollarSign, Users, Building, Trash2, ExternalLink, Smartphone, CheckCircle } from 'lucide-react';
import './styles/super-hotels.css';

const SuperHotels = () => {
    const navigate = useNavigate();
    const [hotels, setHotels] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // --- View Modal State ---
    const [showModal, setShowModal] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [hotelRooms, setHotelRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);

    // --- OTP Delete State ---
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [hotelToDelete, setHotelToDelete] = useState(null);
    const [otpStep, setOtpStep] = useState('request'); 
    const [otpInput, setOtpInput] = useState('');
    const [isOtpLoading, setIsOtpLoading] = useState(false);

    useEffect(() => {
        loadHotels();
    }, []);

    const loadHotels = async () => {
        setLoading(true);
        try {
            const res = await api.get('/hotels');
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setHotels(data);
        } catch(err) { 
            console.error("Failed to load hotels:", err); 
            setHotels([]); 
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (hotel) => {
        const action = hotel.is_active ? 'HIDE' : 'PUBLISH';
        if(!window.confirm(`Are you sure you want to ${action} this hotel?`)) return;
        
        try {
            await api.put(`/hotels/${hotel.id}`, { is_active: !hotel.is_active });
            await loadHotels(); 
        } catch(err) { 
            console.error(err);
            alert("Action failed."); 
        }
    };

    // --- VIEW DETAILS ---
    const handleViewHotel = async (hotel) => {
        setSelectedHotel(hotel);
        setShowModal(true);
        setLoadingRooms(true);
        setHotelRooms([]);

        try {
            const res = await api.get(`/rooms/hotel/${hotel.id}`);
            if (res.data.success) {
                setHotelRooms(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load rooms:", err);
        } finally {
            setLoadingRooms(false);
        }
    };

    // --- LIVE PREVIEW ---
    const handlePreview = (id) => {
        window.open(`/hotel/${id}`, '_blank');
    };

    // --- OTP DELETE FLOW ---
    const initiateDelete = (hotel) => {
        setHotelToDelete(hotel);
        setOtpStep('request');
        setOtpInput('');
        setShowOtpModal(true);
    };

    const requestOtp = () => {
        setIsOtpLoading(true);
        setTimeout(() => {
            setIsOtpLoading(false);
            setOtpStep('verify');
            alert("SECURITY: Your OTP is 123456"); 
        }, 1500);
    };

    const verifyAndDelete = async (e) => {
        e.preventDefault();
        if (otpInput !== '123456') { 
            alert("Invalid OTP. Please try again.");
            return;
        }

        setIsOtpLoading(true);
        try {
            await api.delete(`/hotels/${hotelToDelete.id}`);
            setShowOtpModal(false);
            await loadHotels();
            alert("Hotel deleted successfully.");
        } catch (err) {
            console.error(err);
            alert("Failed to delete hotel.");
        } finally {
            setIsOtpLoading(false);
        }
    };

    const filtered = hotels.filter(h => 
        (h.name && h.name.toLowerCase().includes(search.toLowerCase())) ||
        (h.city && h.city.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div style={{position: 'relative'}}>
            {/* Header */}
            <div className="sa-header-row">
                <div>
                    <h1 className="sa-page-title">Manage Hotels</h1>
                    <p style={{margin:0, color:'var(--text-muted)', fontSize:'0.9rem'}}>Overview of all registered properties</p>
                </div>
                <div className="sa-search-wrapper">
                    <Search size={18} className="sa-search-icon"/>
                    <input 
                        className="sa-search-input"
                        placeholder="Search hotels or cities..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Hotel List Table */}
            <div className="sa-table-card">
                <table className="sa-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th style={{textAlign: 'right'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{textAlign: 'center', padding: '40px'}}><Loader2 className="animate-spin mx-auto" color="var(--text-muted)"/></td></tr>
                        ) : filtered.length > 0 ? (
                            filtered.map(hotel => (
                                <tr key={hotel.id} style={{ opacity: hotel.is_active ? 1 : 0.6 }}>
                                    <td>
                                        <div className="sa-hotel-name">{hotel.name}</div>
                                        <div className="sa-hotel-sub">{hotel.email || 'No Contact Info'}</div>
                                    </td>
                                    <td>
                                        <div className="sa-hotel-sub"><MapPin size={14}/> {hotel.city}, {hotel.country}</div>
                                    </td>
                                    <td>
                                        <span className={`sa-status-badge ${hotel.is_active ? 'active' : 'inactive'}`}>
                                            {hotel.is_active ? 'Active' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="sa-action-group">
                                            <button className="sa-action-btn" title="Live Preview" onClick={() => handlePreview(hotel.id)}>
                                                <ExternalLink size={18} color="var(--color-primary)"/>
                                            </button>
                                            <button className="sa-action-btn" title="View Details" onClick={() => handleViewHotel(hotel)}>
                                                <Eye size={18} color="var(--text-secondary)"/>
                                            </button>
                                            <button className="sa-action-btn" title={hotel.is_active ? "Unpublish" : "Publish"} onClick={() => toggleStatus(hotel)}>
                                                <Power size={18} color={hotel.is_active ? "#10b981" : "#f59e0b"}/>
                                            </button>
                                            <button className="sa-action-btn delete" title="Delete Hotel" onClick={() => initiateDelete(hotel)}>
                                                <Trash2 size={18} color="#ef4444"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px', color: 'var(--text-muted)'}}>No hotels found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- VIEW HOTEL DETAILS MODAL --- */}
            <AnimatePresence>
            {showModal && selectedHotel && (
                <motion.div className="sa-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
                    <motion.div className="sa-modal-content wide-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                        <div className="sa-modal-header">
                            <h3>Property Details</h3>
                            <button onClick={() => setShowModal(false)} className="sa-btn-close"><X size={20}/></button>
                        </div>
                        
                        <div className="sa-modal-body">
                            <div className="hotel-view-hero">
                                <div className="hotel-view-img">
                                    {selectedHotel.main_image 
                                        ? <img src={selectedHotel.main_image} alt={selectedHotel.name} /> 
                                        : <div className="placeholder-img"><Building size={40}/></div>
                                    }
                                </div>
                                <div className="hotel-view-info">
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', width: '100%'}}>
                                        <h2>{selectedHotel.name}</h2>
                                        <button className="btn-preview-link" onClick={() => handlePreview(selectedHotel.id)}>
                                            <ExternalLink size={14}/> Live Page
                                        </button>
                                    </div>
                                    <p className="location"><MapPin size={14}/> {selectedHotel.address_line_1}, {selectedHotel.city}</p>
                                    <div className="badges">
                                        <span className={`sa-status-badge ${selectedHotel.is_active ? 'active' : 'inactive'}`}>
                                            {selectedHotel.is_active ? 'Published' : 'Hidden'}
                                        </span>
                                        <span className="sa-badge-neutral">ID: {selectedHotel.id}</span>
                                    </div>
                                    <div className="contact-info">
                                        {selectedHotel.email && <p><Mail size={14}/> {selectedHotel.email}</p>}
                                        {selectedHotel.phone && <p>📞 {selectedHotel.phone}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="sa-divider"></div>

                            <h4 className="section-title">Room Inventory</h4>
                            {loadingRooms ? (
                                <div className="loading-state"><Loader2 className="animate-spin" size={24}/> Loading Rooms...</div>
                            ) : hotelRooms.length > 0 ? (
                                <div className="rooms-grid">
                                    {hotelRooms.map(room => (
                                        <div key={room.id} className="room-card-mini">
                                            <div className="room-img">
                                                {room.images && room.images.length > 0 
                                                    ? <img src={typeof room.images[0] === 'string' ? room.images[0] : room.images[0].url} alt={room.title}/> 
                                                    : <div className="no-img"><Bed size={20}/></div>
                                                }
                                            </div>
                                            <div className="room-details">
                                                <h5>{room.title}</h5>
                                                <p className="room-type">{room.room_type}</p>
                                                <div className="room-stats">
                                                    <span><DollarSign size={12}/> ${room.base_price_per_night}</span>
                                                    <span><Users size={12}/> {room.capacity}</span>
                                                    <span>🛏️ {room.total_quantity} units</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-state">No rooms found for this hotel.</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* --- OTP DELETE MODAL --- */}
            <AnimatePresence>
            {showOtpModal && (
                <motion.div className="sa-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOtpModal(false)}>
                    <motion.div className="sa-modal-content narrow-modal text-center" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                        <div className="sa-modal-header" style={{border: 'none', paddingBottom: 0}}>
                            <button onClick={() => setShowOtpModal(false)} className="sa-btn-close ml-auto"><X size={20}/></button>
                        </div>
                        <div className="sa-modal-body" style={{paddingTop: 0}}>
                            <div className="otp-icon-wrapper">
                                <Smartphone size={32} color="var(--color-primary)"/>
                            </div>
                            
                            {otpStep === 'request' ? (
                                <>
                                    <h3 style={{margin: '0 0 10px', color: 'var(--color-dark)'}}>Delete {hotelToDelete?.name}?</h3>
                                    <p className="modal-text">
                                        This action is irreversible. To confirm deletion, 
                                        we need to verify your identity via OTP.
                                    </p>
                                    <button className="btn-primary-large" onClick={requestOtp} disabled={isOtpLoading}>
                                        {isOtpLoading ? <Loader2 className="animate-spin" /> : "Send OTP"}
                                    </button>
                                </>
                            ) : (
                                <form onSubmit={verifyAndDelete} className="otp-form">
                                    <h3 style={{margin: '0 0 10px', color: 'var(--color-dark)'}}>Enter OTP</h3>
                                    <p className="modal-text">Code sent to admin mobile (Dev: 123456)</p>
                                    <input type="text" className="otp-input" placeholder="• • • • • •" maxLength={6} value={otpInput} onChange={e => setOtpInput(e.target.value)} autoFocus/>
                                    <button type="submit" className="btn-danger-large" disabled={isOtpLoading || otpInput.length < 6}>
                                        {isOtpLoading ? <Loader2 className="animate-spin" /> : "Confirm Delete"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default SuperHotels;