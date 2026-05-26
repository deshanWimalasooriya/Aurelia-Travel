import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { 
    Calendar, MapPin, Clock, Users, CreditCard, 
    MessageSquare, Star, X, BedDouble, Plane, Ticket
} from 'lucide-react';
import './styles/my-bookings.css';

const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Review Modal States
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewTarget, setReviewTarget] = useState(null); 
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const response = await api.get('/bookings/my-bookings');
                let data = [];
                if (Array.isArray(response.data)) data = response.data;
                else if (response.data && Array.isArray(response.data.data)) data = response.data.data;
                setBookings(data);
            } catch (err) {
                console.error("Failed to fetch bookings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const calculateNights = (start, end) => {
        if(!start || !end) return 1;
        const s = new Date(start); const e = new Date(end);
        return Math.max(1, Math.ceil(Math.abs(e-s)/(1000*60*60*24)));
    };

    const handleOpenReview = (booking) => {
        const targetHotelId = booking.hotel?.id || booking.hotel_id;
        const targetHotelName = booking.hotel?.name || booking.hotel_name || "Hotel";
        if (!targetHotelId) {
            alert("Unable to load hotel details for this review."); return;
        }
        setReviewTarget({ bookingId: booking.id, hotelId: targetHotelId, hotelName: targetHotelName });
        setReviewForm({ rating: 5, title: '', comment: '' });
        setShowReviewModal(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewTarget?.hotelId) return;
        try {
            await api.post('/reviews', { ...reviewForm, booking_id: reviewTarget.bookingId, hotel_id: reviewTarget.hotelId });
            alert("Thank you for your review!");
            setShowReviewModal(false);
        } catch (err) { alert(err.response?.data?.message || "Failed to submit review."); }
    };

    const getStatusStyle = (status) => {
        switch(status?.toLowerCase()) {
            case 'confirmed': return 'status-confirmed';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    return (
        <div className="my-bookings-page">
            <div className="container compact-container">
                <div className="page-header">
                    <h1 className="page-title"><Ticket size={28} className="icon-primary"/> Your Journeys</h1>
                    <p className="page-subtitle">View and manage your upcoming and past reservations.</p>
                </div>

                <div className="bookings-feed">
                    {loading ? (
                        <div className="loading-state">Loading your itineraries...</div>
                    ) : bookings.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-icon-bg"><Calendar size={40} className="icon-muted"/></div>
                            <h3>No upcoming trips</h3>
                            <p>You don't have any bookings yet. Start planning your next escape!</p>
                            <button className="btn-primary" onClick={() => navigate('/hotel-showcase')} style={{marginTop: '20px'}}>
                                Explore Hotels
                            </button>
                        </div>
                    ) : (
                        bookings.map(booking => {
                            const hotelImage = booking.hotel?.image || booking.hotel_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80';
                            const hotelName = booking.hotel?.name || booking.hotel_name || "Hotel Reservation";
                            const roomTitle = booking.room?.title || booking.room_title || "Standard Room";
                            const location = booking.hotel?.city || booking.hotel_city || "Destination";
                            const checkIn = new Date(booking.checkIn || booking.check_in);
                            const checkOut = new Date(booking.checkOut || booking.check_out);
                            const nights = calculateNights(checkIn, checkOut);
                            const totalPrice = Number(booking.totalPrice || booking.total_price || 0);

                            return (
                                <motion.div 
                                    key={booking.id} 
                                    className="booking-ticket-card"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="btc-image">
                                        <img src={hotelImage} alt={hotelName} />
                                        <div className={`btc-status-badge ${getStatusStyle(booking.status)}`}>
                                            {booking.status}
                                        </div>
                                    </div>
                                    
                                    <div className="btc-content">
                                        <div className="btc-header">
                                            <div>
                                                <h3 className="btc-hotel-name">{hotelName}</h3>
                                                <span className="btc-location"><MapPin size={14}/> {location}</span>
                                            </div>
                                            <div className="btc-price-block">
                                                <span className="price-label">Total Amount</span>
                                                <span className="price-value">${totalPrice.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="btc-room-info">
                                            <span className="room-badge"><BedDouble size={14}/> {roomTitle}</span>
                                            <span className="guest-badge"><Users size={14}/> {booking.adults || 1} Adults {booking.children > 0 ? `, ${booking.children} Kids` : ''}</span>
                                        </div>

                                        <div className="btc-dates-row">
                                            <div className="date-box">
                                                <span className="date-label">Check-In</span>
                                                <span className="date-value">{checkIn.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <div className="date-divider">
                                                <div className="line"></div>
                                                <span className="nights-pill"><Clock size={12}/> {nights} Nights</span>
                                                <div className="line"></div>
                                            </div>
                                            <div className="date-box right">
                                                <span className="date-label">Check-Out</span>
                                                <span className="date-value">{checkOut.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>

                                        <div className="btc-footer">
                                            <div className="payment-info">
                                                <CreditCard size={14}/> Payment: <strong>{booking.payment_status || 'Paid'}</strong>
                                            </div>
                                            <div className="btc-actions">
                                                <button className="btn-ghost-small" onClick={() => navigate(`/hotel/${booking.hotel_id || booking.hotel?.id}`)}>
                                                    View Hotel
                                                </button>
                                                {(booking.status === 'completed' || booking.status === 'confirmed') && (
                                                    <button className="btn-primary-small" onClick={() => handleOpenReview(booking)}>
                                                        <MessageSquare size={14} /> Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* REVIEW MODAL */}
            <AnimatePresence>
                {showReviewModal && (
                    <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                        <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                            <div className="modal-header-row">
                                <h3>Review: {reviewTarget?.hotelName}</h3>
                                <button className="modal-close-icon" onClick={() => setShowReviewModal(false)}><X size={20}/></button>
                            </div>
                            <form onSubmit={handleSubmitReview} className="payment-modal-form">
                                <div className="form-group">
                                    <label>Your Rating</label>
                                    <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                                        {[1,2,3,4,5].map(star => (
                                            <Star 
                                                key={star} size={32} 
                                                fill={star <= reviewForm.rating ? "#f59e0b" : "none"} 
                                                color={star <= reviewForm.rating ? "#f59e0b" : "#cbd5e1"}
                                                style={{cursor:'pointer', transition:'all 0.2s'}}
                                                onClick={() => setReviewForm({...reviewForm, rating: star})}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Summary</label>
                                    <input className="form-input" placeholder="e.g., Amazing stay!" value={reviewForm.title} onChange={e => setReviewForm({...reviewForm, title: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Details</label>
                                    <textarea className="form-input" placeholder="Tell others about your experience..." rows="4" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} required />
                                </div>
                                <button type="submit" className="btn-primary full-width" style={{marginTop:'20px'}}>Submit Review</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyBookings;