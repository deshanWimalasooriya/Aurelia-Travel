import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  MapPin, Star, Check, Wifi, Car, Coffee, Info, ArrowRight, 
  ShieldCheck, Utensils, Monitor, Calendar, Users, TrendingUp, 
  Maximize, Bed, Mountain, User
} from 'lucide-react';
import { useUser } from '../context/userContext';
import './styles/hotelDetails.css';

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const roomsRef = useRef(null);
  
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Booking Data
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [guests, setGuests] = useState({ adults: 2, children: 0 });

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hotelRes, roomRes, reviewRes] = await Promise.all([
          api.get(`/hotels/${id}`),
          api.get(`/rooms/hotel/${id}`),
          api.get(`/reviews/hotel/${id}`).catch(() => ({ data: { data: [] } })) // Soft fail for reviews
        ]);
        
        const hotelData = hotelRes.data.data || hotelRes.data;
        const roomsData = Array.isArray(roomRes.data) 
            ? roomRes.data 
            : (roomRes.data.data || []);
        const reviewsData = Array.isArray(reviewRes.data.data) 
            ? reviewRes.data.data 
            : [];
        
        setHotel(hotelData);
        setRooms(roomsData);
        setReviews(reviewsData);
      } catch (err) {
        console.error("Fetch details error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  // --- 2. CALCULATIONS ---
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 0;
  };

  const nightCount = calculateDays(dates.checkIn, dates.checkOut); 

  // --- 3. AUTO-UPDATE PRICE ---
  useEffect(() => {
    if (selectedRoomId) {
        const room = rooms.find(r => (r._id || r.id) === selectedRoomId);
        if (room) {
            const pricePerNight = parseFloat(room.base_price_per_night || room.price_per_night || 0);
            const effectiveNights = nightCount > 0 ? nightCount : 1;
            setTotalPrice(pricePerNight * effectiveNights);
        }
    } else {
        setTotalPrice(0);
    }
  }, [selectedRoomId, nightCount, rooms]);

  const handleRoomSelect = (roomId) => {
    if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
    } else {
        setSelectedRoomId(roomId);
    }
  };

  // --- 4. HANDLE RESERVATION ---
  const handleReserve = async () => {
    if (!user) { 
        if(!window.confirm("You need to login to book. Proceed to login?")) return;
        navigate('/auth'); 
        return; 
    }
    if (!selectedRoomId) { 
        roomsRef.current?.scrollIntoView({ behavior: 'smooth' });
        alert("Please select a room from the table below.");
        return; 
    }
    if (!dates.checkIn || !dates.checkOut) { alert("Please select check-in and check-out dates."); return; }

    try {
        let paymentToken = "tok_cash_on_arrival";
        try {
            const walletRes = await api.get('/wallet');
            if (walletRes.data.data && walletRes.data.data.length > 0) {
                paymentToken = walletRes.data.data[0].payment_method_id;
            }
        } catch (e) { console.warn("Wallet check skipped"); }

        const bookingPayload = {
            room_id: selectedRoomId,
            check_in: dates.checkIn,
            check_out: dates.checkOut,
            adults: guests.adults,
            children: guests.children,
            payment_token: paymentToken,
            payment_provider: 'stripe'
        };

        const res = await api.post('/bookings', bookingPayload);
        
        if (res.status === 200 || res.status === 201) {
            alert(`🎉 Reservation Successful! Ref: ${res.data.reference}`);
            navigate('/profile');
        }
    } catch (err) {
        alert(err.response?.data?.message || "Booking Failed.");
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div><h3>Loading Hotel...</h3></div>;
  if (!hotel) return <div className="loading-screen">Hotel not found</div>;

  // --- IMAGES & LOCATION ---
  let images = [];
  if (Array.isArray(hotel.images) && hotel.images.length > 0) {
      images = hotel.images.sort((a,b) => (b.is_primary === true) - (a.is_primary === true)).map(img => img.image_url);
  } else if (hotel.main_image) {
      images = [hotel.main_image];
  } else {
      images = ['https://images.unsplash.com/photo-1566073771259-6a8506099945'];
  }
  while(images.length < 4) images.push(images[0]); 

  // Use lat/long if available, otherwise search query
  const mapUrl = hotel.latitude && hotel.longitude 
    ? `https://maps.google.com/maps?q=${hotel.latitude},${hotel.longitude}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}&z=15&output=embed`;

  return (
    <div className="hotel-details-page">
      <div className="container">
        
        {/* 1. HEADER INFO */}
        <section className="header-section">
            <div className="hotel-headline">
                <div>
                    <h1 className="hotel-title">{hotel.name}</h1>
                    <div className="hotel-meta">
                        <span className="meta-item"><MapPin size={16}/> {hotel.city}, {hotel.country}</span>
                        <div className="rating-pill">
                            <Star size={14} fill="currentColor" /> {hotel.rating_average || 4.8} ({hotel.total_reviews || 0} reviews)
                        </div>
                    </div>
                </div>
                <div className="price-lead">
                    <span className="from-text">from</span>
                    <span className="price-amount">${parseFloat(hotel.price_per_night_from || rooms[0]?.base_price_per_night || 0).toLocaleString()}</span>
                    <span className="per-night">/ night</span>
                </div>
            </div>
        </section>

        {/* 2. SPLIT HERO: GALLERY + MAP */}
        <section className="hero-split-section">
            {/* Left: Gallery */}
            <div className="gallery-container">
                <div className="main-image" style={{backgroundImage: `url(${images[0]})`}}></div>
                <div className="sub-images">
                    <div className="sub-img" style={{backgroundImage: `url(${images[1]})`}}></div>
                    <div className="sub-img" style={{backgroundImage: `url(${images[2]})`}}></div>
                    <div className="sub-img" style={{backgroundImage: `url(${images[3]})`}}>
                        <div className="view-more">View All Photos</div>
                    </div>
                </div>
            </div>

            {/* Right: Map */}
            <div className="map-container">
                <iframe 
                    title="Hotel Location"
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight="0" 
                    marginWidth="0" 
                    src={mapUrl}
                ></iframe>
                <div className="map-overlay-label">
                    <MapPin size={16} /> {hotel.address_line_1 || hotel.city}
                </div>
            </div>
        </section>

        {/* 3. MAIN CONTENT GRID */}
        <div className="content-grid">
            
            {/* LEFT COLUMN */}
            <div className="details-content">
                
                {/* Description */}
                <div className="section-card">
                    <h2 className="section-title">Experience the Stay</h2>
                    <p className="description-text">{hotel.description}</p>
                    
                    <h3 className="sub-title">Popular Amenities</h3>
                    <div className="amenities-container">
                         <div className="amenity-pill"><Wifi size={18}/> Fast WiFi</div>
                         <div className="amenity-pill"><ShieldCheck size={18}/> 24/7 Security</div>
                         <div className="amenity-pill"><Utensils size={18}/> Restaurant</div>
                         <div className="amenity-pill"><Car size={18}/> Free Parking</div>
                         {Array.isArray(hotel.amenities) && hotel.amenities.slice(0, 4).map((fac, i) => (
                             <div key={i} className="amenity-pill"><Star size={18}/> {typeof fac === 'object' ? fac.name : fac}</div>
                         ))}
                    </div>
                </div>

                {/* ROOMS TABLE */}
                <div className="section-card" ref={roomsRef}>
                    <h2 className="section-title">Available Rooms</h2>
                    <div className="rooms-table-wrapper">
                        <table className="rooms-table">
                            <thead>
                                <tr>
                                    <th>Room Type</th>
                                    <th>Sleeps</th>
                                    <th>Features</th>
                                    <th>Price</th>
                                    <th>Select</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map((room) => {
                                    const isSelected = selectedRoomId === (room._id || room.id);
                                    const price = parseFloat(room.base_price_per_night || room.price_per_night || 0);
                                    
                                    return (
                                        <tr key={room.id} className={isSelected ? 'selected-row' : ''} onClick={() => handleRoomSelect(room.id)}>
                                            <td>
                                                <div className="room-cell-title">
                                                    <strong>{room.title}</strong>
                                                    <span className="room-sub-text">{room.bed_type || 'Double Bed'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="capacity-cell">
                                                    <Users size={16} /> x {room.capacity || 2}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="features-cell">
                                                    <span className="feature"><Maximize size={14}/> {room.size_sqm || 30}m²</span>
                                                    <span className="feature"><Mountain size={14}/> {room.view_type || 'City View'}</span>
                                                    {room.has_breakfast && <span className="feature highlight">Breakfast</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="price-cell">
                                                    <strong>${price}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <button className={`table-select-btn ${isSelected ? 'active' : ''}`}>
                                                    {isSelected ? <Check size={16}/> : 'Add'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CUSTOMER REVIEWS */}
                <div className="section-card reviews-section">
                    <h2 className="section-title">Guest Reviews</h2>
                    {reviews.length > 0 ? (
                        <div className="reviews-list">
                            {reviews.map((rev) => (
                                <div key={rev.id} className="review-item">
                                    <div className="review-header">
                                        <div className="reviewer-info">
                                            <div className="avatar-circle">
                                                {rev.user_name ? rev.user_name.charAt(0) : <User size={16}/>}
                                            </div>
                                            <div>
                                                <strong>{rev.user_name || "Verified Guest"}</strong>
                                                <span className="review-date">{new Date(rev.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="review-rating">
                                            {rev.rating} <Star size={12} fill="currentColor" />
                                        </div>
                                    </div>
                                    <h4 className="review-title">{rev.title}</h4>
                                    <p className="review-body">{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-reviews">
                            <Info size={24} />
                            <p>No reviews yet. Be the first to share your experience!</p>
                        </div>
                    )}
                </div>

            </div>

            {/* RIGHT: STICKY BOOKING WIDGET */}
            <div className="sidebar-column">
                <div className="booking-widget">
                    
                    <div className="price-header">
                        <div className="price-display">
                            <span className="currency">$</span>
                            <span className="amount">
                                {totalPrice > 0 ? totalPrice.toLocaleString() : (parseFloat(hotel.price_per_night_from || 0))}
                            </span>
                            <span className="text">
                                {nightCount > 0 ? ` total` : ' / night'}
                            </span>
                        </div>
                        <div className="demand-badge">
                            <TrendingUp size={14}/> Popular
                        </div>
                    </div>

                    <div className="picker-grid">
                        <div className="input-box">
                            <label>CHECK-IN</label>
                            <input type="date" value={dates.checkIn} onChange={(e) => setDates({...dates, checkIn: e.target.value})} />
                        </div>
                        <div className="input-box">
                            <label>CHECK-OUT</label>
                            <input type="date" value={dates.checkOut} onChange={(e) => setDates({...dates, checkOut: e.target.value})} />
                        </div>
                    </div>

                    <div className="input-box" style={{marginBottom: '20px'}}>
                        <label>GUESTS</label>
                        <select value={guests.adults} onChange={e => setGuests({...guests, adults: parseInt(e.target.value)})}>
                            <option value="1">1 Adult</option>
                            <option value="2">2 Adults</option>
                            <option value="3">3 Adults</option>
                            <option value="4">4 Adults</option>
                        </select>
                    </div>

                    {/* UX Messages */}
                    {selectedRoomId ? (
                        <div className="notification success">
                            <Check size={16}/> Room selected
                        </div>
                    ) : (
                        <div className="notification warning">
                            <Info size={16}/> Select a room from the table
                        </div>
                    )}

                    <button className="book-btn" onClick={handleReserve}>
                        {selectedRoomId ? 'Reserve Securely' : 'Check Availability'}
                    </button>

                    <p className="no-charge-text">You won't be charged yet</p>

                    {totalPrice > 0 && (
                        <div className="total-row">
                            <span>Total (Tax incl.)</span>
                            <span>${(totalPrice * 1.1).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default HotelDetails;