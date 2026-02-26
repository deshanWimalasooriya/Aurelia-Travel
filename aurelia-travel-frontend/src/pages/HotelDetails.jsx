import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  MapPin, Star, Check, Wifi, Car, Coffee, Info, ArrowRight, 
  ShieldCheck, Utensils, Calendar, Users, TrendingUp, 
  Maximize, Mountain, User, Clock, AlertCircle, Ban, Dog, Globe,
  Bed, Eye, X, Image as ImageIcon, Heart, BedDouble, Bath
} from 'lucide-react';
import { useUser } from '../context/userContext';
import { useWishlist } from '../context/WishlistContext'; 
import ImageGallery from '../components/ui/ImageGallery'; 
import HotelDetailsSkeleton from '../components/ui/HotelDetailsSkeleton'; 
import './styles/HotelDetails.css';

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const roomsRef = useRef(null);
  
  // Data States
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Wishlist Logic
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isSaved = hotel ? isInWishlist(hotel.id) : false;
  
  // Gallery State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Room Popup & Gallery State
  const [viewingRoom, setViewingRoom] = useState(null);
  const [isRoomGalleryOpen, setIsRoomGalleryOpen] = useState(false);

  // Selection State
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomQty, setRoomQty] = useState(1); 
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Booking Data
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [guests, setGuests] = useState({ adults: 2, children: 0 });

  // --- HELPER: SAFE JSON PARSER ---
  const safeParse = (data) => {
      if (!data) return [];
      if (typeof data === 'string') {
          try { return JSON.parse(data); } catch (e) { return []; }
      }
      return Array.isArray(data) ? data : [];
  };

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hotelRes, roomRes, reviewRes] = await Promise.all([
          api.get(`/hotels/${id}`),
          api.get(`/rooms/hotel/${id}`),
          api.get(`/reviews/hotel/${id}`).catch(() => ({ data: { data: [] } }))
        ]);
        
        const hotelData = hotelRes.data.data || hotelRes.data;
        const rawRooms = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data.data || []);
        const activeRooms = rawRooms.filter(room => room.is_active);
        const reviewsData = Array.isArray(reviewRes.data.data) ? reviewRes.data.data : [];
        
        setHotel(hotelData);
        setRooms(activeRooms); 
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
            setTotalPrice(pricePerNight * effectiveNights * roomQty);
        }
    } else {
        setTotalPrice(0);
    }
  }, [selectedRoomId, nightCount, rooms, roomQty]);

  const handleRoomSelect = (roomId) => {
    if (selectedRoomId !== roomId) {
        setSelectedRoomId(roomId);
        if (selectedRoomId !== roomId) setRoomQty(1); 
    } else {
        setSelectedRoomId(null);
        setRoomQty(1);
    }
  };

  const handleViewDetails = (room) => {
      setViewingRoom(room);
  };

  const getRoomImages = (room) => {
      if (!room) return [];
      let imgs = [];
      if (room.images && Array.isArray(room.images)) {
          imgs = room.images.map(img => typeof img === 'object' ? img.url || img.image_url : img);
      } else if (room.images_meta && Array.isArray(room.images_meta)) {
          imgs = room.images_meta.map(img => img.url);
      } else if (room.main_image) {
          imgs = [room.main_image];
      }
      return imgs.filter(Boolean);
  };

  const currentRoomImages = viewingRoom ? getRoomImages(viewingRoom) : [];

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
            room_count: roomQty, 
            total_price: totalPrice, 
            payment_token: paymentToken,
            payment_provider: 'stripe'
        };

        const res = await api.post('/bookings', bookingPayload);
        
        if (res.status === 200 || res.status === 201) {
            alert(`🎉 Reservation Successful! Ref: ${res.data.reference}`);
            navigate('/profile');
        }
    } catch (err) {
        if (err.response && err.response.status === 401) {
            alert("Session expired. Please login again.");
            navigate('/auth');
        } else {
            alert(err.response?.data?.message || "Booking Failed.");
        }
    }
  };

  const renderStars = (rating) => {
    return (
        <div style={{display:'flex', gap:'2px'}}>
            {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < rating ? "var(--color-accent)" : "none"} color={i < rating ? "var(--color-accent)" : "#cbd5e1"} />
            ))}
        </div>
    );
  };

  if (loading) return <HotelDetailsSkeleton />;
  if (!hotel) return <div className="loading-screen">Hotel not found</div>;

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
  
  let rawImages = [];
  if (Array.isArray(hotel.images) && hotel.images.length > 0) {
      rawImages = hotel.images.map(img => (typeof img === 'object' && img.image_url ? img.image_url : img));
  } else if (hotel.main_image) {
      rawImages = [hotel.main_image];
  } 
  
  let cleanGalleryImages = rawImages.filter(img => img); 
  if (cleanGalleryImages.length === 0) cleanGalleryImages = [DEFAULT_IMAGE];

  let layoutImages = [...cleanGalleryImages];
  while(layoutImages.length < 4) { layoutImages.push(layoutImages[0] || DEFAULT_IMAGE); }

  const mapUrl = hotel.latitude && hotel.longitude 
    ? `https://maps.google.com/maps?q=${hotel.latitude},${hotel.longitude}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(hotel.name + ' ' + hotel.city)}&z=15&output=embed`;

  return (
    <div className="hotel-details-page">
      <div className="container">
        
        {/* HEADER */}
        <section className="header-section">
            <div className="hotel-headline">
                <div>
                    <h1 className="hotel-title">{hotel.name}</h1>
                    <div className="wishlist-action-row">
                        <button onClick={() => toggleWishlist(hotel)} className={`wishlist-btn ${isSaved ? 'saved' : ''}`}>
                            <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                            {isSaved ? 'Saved to Wishlist' : 'Save Property'}
                        </button>
                    </div>
                    <div className="hotel-meta">
                        <span className="meta-item"><MapPin size={16}/> {hotel.address_line_1}, {hotel.city}, {hotel.country}</span>
                        <div className="rating-pill">
                            <Star size={14} fill="currentColor" /> {hotel.rating_average || 4.8} ({hotel.total_reviews || 0} reviews)
                        </div>
                    </div>
                </div>
                <div className="price-lead">
                    <span className="from-text">From</span>
                    <span className="price-amount">${parseFloat(hotel.price_per_night_from || rooms[0]?.base_price_per_night || 0).toLocaleString()}</span>
                    <span className="per-night">/ night</span>
                </div>
            </div>
        </section>

        {/* HERO: GALLERY + MAP */}
        <section className="hero-split-section">
            <div className="gallery-container">
                <div className="main-image" style={{backgroundImage: `url('${layoutImages[0]}')`}} onClick={() => setIsGalleryOpen(true)}></div>
                <div className="sub-images">
                    <div className="sub-img" style={{backgroundImage: `url('${layoutImages[1]}')`}} onClick={() => setIsGalleryOpen(true)}></div>
                    <div className="sub-img" style={{backgroundImage: `url('${layoutImages[2]}')`}} onClick={() => setIsGalleryOpen(true)}></div>
                    <div className="sub-img more-photos" style={{backgroundImage: `url('${layoutImages[3]}')`}} onClick={() => setIsGalleryOpen(true)}>
                        <div className="view-more"><span>View Gallery</span></div>
                    </div>
                </div>
            </div>
            
            <div className="map-container">
                <iframe title="Location" width="100%" height="100%" frameBorder="0" src={mapUrl}></iframe>
            </div>
        </section>

        {/* MAIN CONTENT GRID */}
        <div className="content-grid">
            
            {/* LEFT COLUMN */}
            <div className="details-content">
                
                {/* --- 1. OVERVIEW, AMENITIES & POLICIES --- */}
                <div className="section-card">
                    <h2 className="section-title">Experience the Stay</h2>
                    <p className="description-text">
                        {hotel.description || "Enjoy a relaxing stay at " + hotel.name + ". This property offers excellent accommodation and services to make your visit memorable."}
                    </p>
                    
                    <div className="hotel-info-grid">
                        {/* Column 1: Services & Languages */}
                        <div>
                            <h3 className="sub-title"><ShieldCheck size={18}/> Premium Services</h3>
                            <div className="amenities-container">
                                {safeParse(hotel.services).length > 0 ? (
                                    safeParse(hotel.services).map((srv, idx) => (
                                        <div key={idx} className="amenity-pill"><Check size={16} /> {srv}</div>
                                    ))
                                ) : (
                                    <span className="muted-text">Standard services available.</span>
                                )}
                            </div>

                            <h3 className="sub-title mt-24"><Globe size={18}/> Languages Spoken</h3>
                            <div className="lang-container">
                                {safeParse(hotel.languages).length > 0 ? (
                                    safeParse(hotel.languages).map((lang, idx) => (
                                        <span key={idx} className="lang-pill">{lang}</span>
                                    ))
                                ) : (
                                    <span className="muted-text">English</span>
                                )}
                            </div>
                        </div>

                        {/* Column 2: House Rules & Allowances */}
                        <div className="rules-box">
                            <h3 className="sub-title"><Ban size={18}/> House Rules</h3>
                            <ul className="rules-list">
                                <li>
                                    <span className="rule-label"><Clock size={14}/> Check-in</span> 
                                    <strong>{hotel.check_in_time || '14:00'}</strong>
                                </li>
                                <li>
                                    <span className="rule-label"><Clock size={14}/> Check-out</span> 
                                    <strong>{hotel.check_out_time || '11:00'}</strong>
                                </li>
                                <li>
                                    <span className="rule-label">Min Age</span> 
                                    <strong>{hotel.min_age || 18}+</strong>
                                </li>
                                <li>
                                    <span className="rule-label">Damage Deposit</span> 
                                    <strong>${hotel.damage_deposit || 0}</strong>
                                </li>
                                <li>
                                    <span className="rule-label">Pets</span> 
                                    <strong className={hotel.pets_allowed ? 'status-green' : 'status-red'}>{hotel.pets_allowed ? 'Allowed' : 'Not Allowed'}</strong>
                                </li>
                                <li>
                                    <span className="rule-label">Parties</span> 
                                    <strong className={hotel.parties_allowed ? 'status-green' : 'status-red'}>{hotel.parties_allowed ? 'Allowed' : 'Not Allowed'}</strong>
                                </li>
                            </ul>
                            {hotel.custom_rules && (
                                <div className="custom-rules-text">"{hotel.custom_rules}"</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- 2. ROOMS TABLE --- */}
                <div className="section-card" ref={roomsRef}>
                    <h2 className="section-title">Available Suites & Rooms</h2>
                    <div className="rooms-table-wrapper">
                        <table className="rooms-table">
                            <thead>
                                <tr>
                                    <th>Room Type</th>
                                    <th>Capacity</th>
                                    <th>Details</th>
                                    <th style={{textAlign:'center'}}>Qty</th> 
                                    <th>Price</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map((room) => {
                                    const isSelected = selectedRoomId === (room._id || room.id);
                                    const price = parseFloat(room.base_price_per_night || room.price_per_night || 0);
                                    
                                    let previewImage = room.main_image;
                                    if (!previewImage && room.images && room.images.length > 0) {
                                        const first = room.images[0];
                                        previewImage = typeof first === 'object' ? (first.image_url || first.url) : first;
                                    }

                                    return (
                                        <tr key={room.id} className={isSelected ? 'selected-row' : ''}>
                                            <td>
                                                <div className="room-cell-main">
                                                    <div className="room-table-thumbnail" onClick={() => handleViewDetails(room)}>
                                                        {previewImage ? (
                                                            <img src={previewImage} alt={room.title} />
                                                        ) : (
                                                            <div className="no-room-img"><Bed size={20}/></div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <strong className="clickable-room-title" onClick={() => handleViewDetails(room)}>{room.title}</strong>
                                                        <div className="room-bed-text">{room.bed_type || 'Double Bed'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><div className="capacity-cell"><Users size={16} /> x {room.capacity || 2}</div></td>
                                            <td>
                                                <div className="features-cell">
                                                    <span className="feature"><Maximize size={14}/> {room.size_sqm || 30}m²</span>
                                                    <span className="feature"><Mountain size={14}/> {room.view_type || 'View'}</span>
                                                    <button className="view-details-small-btn" onClick={() => handleViewDetails(room)}><Eye size={14}/> View</button>
                                                </div>
                                            </td>
                                            <td style={{textAlign:'center'}}>
                                                <select 
                                                    className="qty-select"
                                                    value={isSelected ? roomQty : 1}
                                                    onChange={(e) => {
                                                        setSelectedRoomId(room.id); 
                                                        setRoomQty(parseInt(e.target.value)); 
                                                    }}
                                                >
                                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            </td>
                                            <td><div className="price-cell"><strong>${price}</strong></div></td>
                                            <td>
                                                <button 
                                                    className={`table-select-btn ${isSelected ? 'active' : ''}`}
                                                    onClick={() => handleRoomSelect(room.id)}
                                                >
                                                    {isSelected ? <Check size={16}/> : 'Select'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {rooms.length === 0 && (
                                    <tr><td colSpan="6" className="empty-table-text">No active rooms available at the moment.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- 3. REVIEWS SECTION --- */}
                <div className="section-card reviews-section">
                    <div className="reviews-header-bar">
                        <h2 className="section-title" style={{marginBottom: 0}}>Guest Reviews</h2>
                        <div className="rating-summary-box">
                            <div className="score-box">{hotel.rating_average || 4.8}</div>
                            <div className="score-text">
                                <span className="score-word">Exceptional</span>
                                <span className="review-count-text">{hotel.total_reviews || 0} reviews</span>
                            </div>
                        </div>
                    </div>
                    {reviews.length > 0 ? (
                        <div className="reviews-grid">
                            {reviews.map((rev) => (
                                <div key={rev.id} className="review-card">
                                    <div className="review-user-row">
                                        <div className="avatar-circle">
                                            {rev.profile_image ? (
                                                <img src={rev.profile_image} alt="User" />
                                            ) : (
                                                (rev.user_name || "G").charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="user-meta">
                                            <span className="user-name">{rev.user_name || "Verified Guest"}</span>
                                            <span className="user-country">{new Date(rev.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="review-content-block">
                                        <div className="review-date-row">
                                            {renderStars(rev.rating)}
                                        </div>
                                        <h4 className="review-subject">{rev.title}</h4>
                                        <p className="review-body">{rev.comment}</p>

                                        {rev.hotel_response && (
                                            <div className="hotel-response-public">
                                                <span className="response-label">Response from Property</span>
                                                <p>{rev.hotel_response}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-reviews">
                            <Info size={24} className="mb-10"/>
                            <p>No reviews yet. Be the first to share your experience!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: STICKY WIDGET */}
            <div className="sidebar-column">
                <div className="booking-widget">
                    <div className="price-header">
                        <div className="price-display">
                            <span className="currency">$</span>
                            <span className="amount">{totalPrice > 0 ? totalPrice.toLocaleString() : (parseFloat(hotel.price_per_night_from || rooms[0]?.base_price_per_night || 0))}</span>
                            <span className="price-note">{nightCount > 0 ? ` total` : ' / night'}</span>
                        </div>
                        <div className="demand-badge"><TrendingUp size={14}/> High Demand</div>
                    </div>
                    
                    <div className="picker-grid">
                        <div className="input-box"><label>CHECK-IN</label><input type="date" value={dates.checkIn} onChange={(e) => setDates({...dates, checkIn: e.target.value})} /></div>
                        <div className="input-box"><label>CHECK-OUT</label><input type="date" value={dates.checkOut} onChange={(e) => setDates({...dates, checkOut: e.target.value})} /></div>
                    </div>
                    
                    <div className="input-box mb-24">
                        <label>GUESTS</label>
                        <select value={guests.adults} onChange={e => setGuests({...guests, adults: parseInt(e.target.value)})}>
                            <option value="1">1 Adult</option><option value="2">2 Adults</option><option value="3">3 Adults</option><option value="4">4 Adults</option>
                        </select>
                    </div>
                    
                    <button className="book-btn" onClick={handleReserve}>{selectedRoomId ? 'Reserve Securely' : 'Check Availability'}</button>
                    <p className="no-charge-text">You won't be charged yet</p>
                    
                    {totalPrice > 0 && (
                        <div className="total-row">
                            <span>Total</span>
                            <span>${totalPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
      
      {/* HOTEL GALLERY */}
      <ImageGallery 
        images={cleanGalleryImages} 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)} 
      />

      {/* --- ROOM DETAILS MODAL --- */}
      {viewingRoom && (
          <div className="room-modal-overlay" onClick={() => setViewingRoom(null)}>
              <div className="room-modal-content" onClick={e => e.stopPropagation()}>
                  
                  <button className="room-modal-close" onClick={() => setViewingRoom(null)}>
                      <X size={20}/>
                  </button>

                  <div className="room-modal-scroll-area">
                      
                      <div className="room-modal-hero" style={{backgroundImage: `url('${currentRoomImages[0] || DEFAULT_IMAGE}')`}}>
                          <button className="view-gallery-btn" onClick={() => setIsRoomGalleryOpen(true)}>
                              <ImageIcon size={18} /> View Photos
                          </button>
                      </div>

                      <div className="room-modal-body">
                          {/* Header: Title & Badge */}
                          <div className="room-modal-header">
                              <h2>{viewingRoom.title}</h2>
                              <span className="room-type-badge">{viewingRoom.room_type}</span>
                          </div>

                          <div className="room-features-grid">
                              <div className="feature-item"><Users size={22}/> <span>{viewingRoom.max_adults} Adults, {viewingRoom.max_children} Kids</span></div>
                              <div className="feature-item"><Maximize size={22}/> <span>{viewingRoom.size_sqm || '- '} m²</span></div>
                              <div className="feature-item"><Bed size={22}/> <span>{viewingRoom.bed_type || 'King'}</span></div>
                              <div className="feature-item"><Mountain size={22}/> <span>{viewingRoom.view_type || 'City View'}</span></div>
                          </div>

                          {/* Room Amenities Array */}
                          {safeParse(viewingRoom.room_amenities).length > 0 && (
                              <div className="modal-section-group">
                                  <h4 className="modal-sub-title"><BedDouble size={18}/> Inside the Room</h4>
                                  <div className="room-amenities-list">
                                      {safeParse(viewingRoom.room_amenities).map((am, idx) => (
                                          <span key={idx} className="modal-pill"><Check size={14} /> {am}</span>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* Bathroom Amenities Array */}
                          <div className="modal-section-group">
                              <h4 className="modal-sub-title"><Bath size={18}/> Bathroom ({viewingRoom.bathroom_type || 'Private En-suite'})</h4>
                              <div className="room-amenities-list">
                                  {safeParse(viewingRoom.bathroom_amenities).length > 0 ? (
                                      safeParse(viewingRoom.bathroom_amenities).map((am, idx) => (
                                          <span key={idx} className="modal-pill green-tint"><Check size={14} /> {am}</span>
                                      ))
                                  ) : (
                                      <span className="muted-text">Standard bathroom setup.</span>
                                  )}
                              </div>
                          </div>

                          {/* Custom Features */}
                          {viewingRoom.custom_features && (
                              <div className="custom-feature-alert">
                                  <strong>Special Feature:</strong> {viewingRoom.custom_features}
                              </div>
                          )}
                          
                          {/* Fallback description */}
                          {viewingRoom.description && !viewingRoom.room_amenities && (
                              <div className="room-modal-description fallback-desc" dangerouslySetInnerHTML={{ __html: viewingRoom.description }} />
                          )}
                      </div>
                  </div>

                  <div className="room-modal-footer">
                      <div className="modal-price">
                          <span className="amount">${viewingRoom.base_price_per_night}</span>
                          <span className="text">per night</span>
                      </div>
                      <button 
                          className={`modal-select-btn ${selectedRoomId === viewingRoom.id ? 'selected' : ''}`}
                          onClick={() => {
                              handleRoomSelect(viewingRoom.id);
                              setViewingRoom(null); 
                          }}
                      >
                          {selectedRoomId === viewingRoom.id ? 'Currently Selected' : 'Select This Room'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ROOM SPECIFIC GALLERY */}
      <ImageGallery 
        images={currentRoomImages.length > 0 ? currentRoomImages : [DEFAULT_IMAGE]} 
        isOpen={isRoomGalleryOpen} 
        onClose={() => setIsRoomGalleryOpen(false)} 
      />

    </div>
  );
};

export default HotelDetails;