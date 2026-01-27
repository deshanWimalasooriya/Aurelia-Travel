import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  MapPin, Star, Check, Wifi, Car, Coffee, Info, ArrowRight, 
  ShieldCheck, Utensils, Calendar, Users, TrendingUp, 
  Maximize, Mountain, User, Clock, AlertCircle, Ban, Dog, 
  Bed, Eye, X, Image as ImageIcon 
} from 'lucide-react';
import { useUser } from '../context/userContext';
import ImageGallery from '../components/ui/ImageGallery'; 
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
        
        // Handle raw room data
        const rawRooms = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data.data || []);
        
        // ✅ MODIFIED: Filter to only show active rooms
        const activeRooms = rawRooms.filter(room => room.is_active);

        const reviewsData = Array.isArray(reviewRes.data.data) ? reviewRes.data.data : [];
        
        setHotel(hotelData);
        setRooms(activeRooms); // Set filtered list
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

  // Handle View Details Modal
  const handleViewDetails = (room) => {
      setViewingRoom(room);
  };

  // Helper to extract room images for gallery
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

  if (loading) return <div className="loading-screen"><div className="spinner"></div><h3>Loading Hotel...</h3></div>;
  if (!hotel) return <div className="loading-screen">Hotel not found</div>;

  // --- IMAGES & LOCATION LOGIC ---
  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
  
  let rawImages = [];
  if (Array.isArray(hotel.images) && hotel.images.length > 0) {
      rawImages = hotel.images.map(img => (typeof img === 'object' && img.image_url ? img.image_url : img));
  } else if (hotel.main_image) {
      rawImages = [hotel.main_image];
  } 
  
  let cleanGalleryImages = rawImages.filter(img => img); 
  if (cleanGalleryImages.length === 0) {
      cleanGalleryImages = [DEFAULT_IMAGE];
  }

  let layoutImages = [...cleanGalleryImages];
  while(layoutImages.length < 4) {
      layoutImages.push(layoutImages[0] || DEFAULT_IMAGE);
  }

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
                    <div className="hotel-meta">
                        <span className="meta-item"><MapPin size={16} className="icon-blue"/> {hotel.address_line_1}, {hotel.city}, {hotel.country}</span>
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

        {/* HERO: GALLERY + MAP */}
        <section className="hero-split-section">
            <div className="gallery-container">
                <div 
                    className="main-image" 
                    style={{backgroundImage: `url('${layoutImages[0]}')`}}
                    onClick={() => setIsGalleryOpen(true)}
                ></div>
                <div className="sub-images">
                    <div className="sub-img" style={{backgroundImage: `url('${layoutImages[1]}')`}} onClick={() => setIsGalleryOpen(true)}></div>
                    <div className="sub-img" style={{backgroundImage: `url('${layoutImages[2]}')`}} onClick={() => setIsGalleryOpen(true)}></div>
                    <div className="sub-img more-photos" style={{backgroundImage: `url('${layoutImages[3]}')`}} onClick={() => setIsGalleryOpen(true)}>
                        <div className="view-more"><span>+ View Gallery</span></div>
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
                
                {/* --- DESCRIPTION & AMENITIES --- */}
                <div className="section-card">
                    <h2 className="section-title">Experience the Stay</h2>
                    <p className="description-text">
                        {hotel.description || "Enjoy a relaxing stay at " + hotel.name + ". This property offers excellent accommodation and services to make your visit memorable."}
                    </p>
                    
                    <h3 className="section-title" style={{fontSize: '18px', marginTop: '30px'}}>Popular Amenities</h3>
                    <div className="amenities-container">
                         {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 ? (
                             hotel.amenities.map((item, index) => (
                                 <div key={index} className="amenity-pill">
                                     <Check size={18} /> 
                                     {typeof item === 'object' ? item.name : item}
                                 </div>
                             ))
                         ) : (
                             <>
                                <div className="amenity-pill"><Wifi size={18}/> Free WiFi</div>
                                <div className="amenity-pill"><ShieldCheck size={18}/> 24/7 Security</div>
                                <div className="amenity-pill"><Utensils size={18}/> Restaurant</div>
                                <div className="amenity-pill"><Car size={18}/> Free Parking</div>
                                <div className="amenity-pill"><Coffee size={18}/> Breakfast Included</div>
                             </>
                         )}
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
                                    <th>Capacity</th>
                                    <th>Details</th>
                                    <th style={{textAlign:'center'}}>Nr. Rooms</th> 
                                    <th>Price</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map((room) => {
                                    const isSelected = selectedRoomId === (room._id || room.id);
                                    const price = parseFloat(room.base_price_per_night || room.price_per_night || 0);
                                    
                                    // Robust Image Selection for Preview
                                    let previewImage = room.main_image;
                                    if (!previewImage && room.images && room.images.length > 0) {
                                        const first = room.images[0];
                                        previewImage = typeof first === 'object' ? (first.image_url || first.url) : first;
                                    }

                                    return (
                                        <tr key={room.id} className={isSelected ? 'selected-row' : ''}>
                                            <td>
                                                <div className="room-cell-main">
                                                    {/* IMAGE THUMBNAIL */}
                                                    <div className="room-table-thumbnail" onClick={() => handleViewDetails(room)}>
                                                        {previewImage ? (
                                                            <img src={previewImage} alt={room.title} />
                                                        ) : (
                                                            <div className="room-placeholder-icon"><Bed size={20}/></div>
                                                        )}
                                                    </div>

                                                    <div className="room-meta-group">
                                                        {/* Clickable Title */}
                                                        <strong 
                                                            className="clickable-room-title" 
                                                            onClick={() => handleViewDetails(room)}
                                                        >
                                                            {room.title}
                                                        </strong>
                                                        <span className="room-sub-text">{room.bed_type || 'Double Bed'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><div className="capacity-cell"><Users size={16} /> x {room.capacity || 2}</div></td>
                                            <td>
                                                <div className="features-cell">
                                                    <span className="feature"><Maximize size={14}/> {room.size_sqm || 30}m²</span>
                                                    <span className="feature"><Mountain size={14}/> {room.view_type || 'View'}</span>
                                                    {/* View Details Button */}
                                                    <button 
                                                        className="view-details-small-btn" 
                                                        onClick={() => handleViewDetails(room)}
                                                        title="View Room Details"
                                                    >
                                                        <Eye size={14}/> View
                                                    </button>
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
                                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '600', color: '#0f172a' }}
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
                                    <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>No active rooms available at the moment.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* REVIEWS */}
                <div className="section-card reviews-section">
                    <div className="reviews-header-bar">
                        <h2 className="section-title">Guest Reviews</h2>
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
                                        <div className="user-avatar">{rev.user_name ? rev.user_name.charAt(0) : "G"}</div>
                                        <div className="user-meta">
                                            <span className="user-name">{rev.user_name || "Verified Guest"}</span>
                                            <span className="user-country">Sri Lanka</span>
                                        </div>
                                    </div>
                                    <div className="review-content-block">
                                        <div className="review-date-row">
                                            <span className="review-date">Reviewed on {new Date(rev.created_at).toLocaleDateString()}</span>
                                            <span className="review-score-small">{rev.rating}</span>
                                        </div>
                                        <h4 className="review-subject">{rev.title}</h4>
                                        <p className="review-body">{rev.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-reviews" style={{textAlign:'center', padding:'40px', color:'#666'}}>
                            <Info size={24} style={{marginBottom:'10px'}}/>
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
                            <span className="amount">{totalPrice > 0 ? totalPrice.toLocaleString() : (parseFloat(hotel.price_per_night_from || 0))}</span>
                            <span className="text">{nightCount > 0 ? ` total` : ' / night'}</span>
                        </div>
                        <div className="demand-badge"><TrendingUp size={14}/> High Demand</div>
                    </div>
                    <div className="picker-grid">
                        <div className="input-box"><label>CHECK-IN</label><input type="date" value={dates.checkIn} onChange={(e) => setDates({...dates, checkIn: e.target.value})} /></div>
                        <div className="input-box"><label>CHECK-OUT</label><input type="date" value={dates.checkOut} onChange={(e) => setDates({...dates, checkOut: e.target.value})} /></div>
                    </div>
                    <div className="input-box" style={{marginBottom: '20px'}}>
                        <label>GUESTS</label>
                        <select value={guests.adults} onChange={e => setGuests({...guests, adults: parseInt(e.target.value)})}>
                            <option value="1">1 Adult</option><option value="2">2 Adults</option><option value="3">3 Adults</option><option value="4">4 Adults</option>
                        </select>
                    </div>
                    {selectedRoomId ? (
                        <div className="notification success"><Check size={16}/> {roomQty} Room{roomQty > 1 ? 's' : ''} Selected</div>
                    ) : (
                        <div className="notification warning"><Info size={16}/> Select a room from the table</div>
                    )}
                    <button className="book-btn" onClick={handleReserve}>{selectedRoomId ? 'Reserve Securely' : 'Check Availability'}</button>
                    <p className="no-charge-text">You won't be charged yet</p>
                    {totalPrice > 0 && (
                        <div className="total-row"><span>Total (Tax incl.)</span><span>${(totalPrice * 1.1).toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
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

      {/* ROOM DETAILS MODAL */}
      {viewingRoom && (
          <div className="room-modal-overlay" onClick={() => setViewingRoom(null)}>
              <div className="room-modal-content" onClick={e => e.stopPropagation()}>
                  <button className="room-modal-close" onClick={() => setViewingRoom(null)}><X size={20}/></button>
                  <div className="room-modal-scroll-area">
                      <div className="room-modal-hero" style={{backgroundImage: `url('${currentRoomImages[0] || DEFAULT_IMAGE}')`}}>
                          <button className="view-gallery-btn" onClick={() => setIsRoomGalleryOpen(true)}>
                              <ImageIcon size={16} /> View Photos
                          </button>
                      </div>
                      <div className="room-modal-body">
                          <div className="room-modal-header">
                              <h2>{viewingRoom.title}</h2>
                              <span className="room-type-badge">{viewingRoom.room_type}</span>
                          </div>
                          <div className="room-modal-description" dangerouslySetInnerHTML={{ __html: viewingRoom.description }} />
                          <div className="room-features-grid">
                              <div className="feature-item"><Users size={20}/> {viewingRoom.max_adults} Adults, {viewingRoom.max_children} Kids</div>
                              <div className="feature-item"><Maximize size={20}/> {viewingRoom.size_sqm || '-'} m²</div>
                              <div className="feature-item"><Bed size={20}/> {viewingRoom.bed_type || 'Double Bed'}</div>
                              <div className="feature-item"><Mountain size={20}/> {viewingRoom.view_type || 'Standard View'}</div>
                          </div>
                          <div className="room-amenities-list">
                              {viewingRoom.has_breakfast ? <span className="modal-pill"><Coffee size={16}/> Breakfast Included</span> : null}
                              {viewingRoom.is_refundable ? <span className="modal-pill"><Check size={16}/> Free Cancellation</span> : null}
                              {viewingRoom.smoking_allowed ? <span className="modal-pill"><Check size={16}/> Smoking Allowed</span> : <span className="modal-pill"><Ban size={16} className="ban-icon"/> Non-Smoking</span>}
                          </div>
                      </div>
                  </div>
                  <div className="room-modal-footer">
                      <div className="modal-price">
                          <span className="amount">${viewingRoom.base_price_per_night}</span>
                          <span className="text">per night</span>
                      </div>
                      <button 
                          className="modal-select-btn"
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