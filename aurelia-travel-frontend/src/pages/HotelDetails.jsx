import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  MapPin, Wifi, Car, Coffee, Star, Check, Users, Info, 
  ArrowRight, ShieldCheck, Utensils, Monitor, Calendar 
} from 'lucide-react'
import { useUser } from '../context/userContext'
import './styles/hotelDetails.css'

const HotelDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const roomsRef = useRef(null) 
  
  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Selection State
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [totalPrice, setTotalPrice] = useState(0)
  
  // Booking Data State
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' })
  const [guests, setGuests] = useState({ adults: 2, children: 0 })

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [hotelRes, roomRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/hotels/${id}`),
          axios.get(`http://localhost:5000/api/rooms/hotel/${id}`)
        ]);
        
        // Handle array vs object response safely
        const hotelData = Array.isArray(hotelRes.data) ? hotelRes.data[0] : hotelRes.data;
        // Backend now returns { data: ... } or array depending on controller
        const roomsData = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data.data || []);
        
        setHotel(hotelData);
        setRooms(roomsData);
      } catch (err) {
        console.error("Fetch details error:", err);
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

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
            // Support both old 'price' and new 'price_per_night'
            const pricePerNight = parseFloat(room.price_per_night || room.price || 0);
            const effectiveNights = nightCount > 0 ? nightCount : 1;
            setTotalPrice(pricePerNight * effectiveNights);
        }
    } else {
        setTotalPrice(0);
    }
  }, [selectedRoomId, nightCount, rooms]);

  const handleRoomSelect = (room) => {
    // Toggle selection
    if (selectedRoomId === (room._id || room.id)) {
        setSelectedRoomId(null);
    } else {
        setSelectedRoomId(room._id || room.id);
    }
  };

  // --- 4. HANDLE RESERVATION ---
  const handleReserve = async () => {
    if (!user) { alert("Please login to book this stay."); navigate('/auth'); return; }
    if (!selectedRoomId) { 
        roomsRef.current?.scrollIntoView({ behavior: 'smooth' });
        alert("Please select a room below."); 
        return; 
    }
    if (!dates.checkIn || !dates.checkOut) { alert("Please select check-in and check-out dates."); return; }

    try {
        const bookingPayload = {
            room_id: selectedRoomId,
            check_in: dates.checkIn,
            check_out: dates.checkOut,
            adults: guests.adults,
            children: guests.children,
            total_price: totalPrice,
            status: "confirmed"
        };
        const res = await axios.post('http://localhost:5000/api/bookings', bookingPayload, {
            withCredentials: true
        });
        if (res.status === 200 || res.status === 201) {
            alert("🎉 Reservation Successful! Pack your bags.");
            navigate('/profile');
        }
    } catch (err) {
        alert(err.response?.data?.message || "Booking Failed");
    }
  };

  if (loading) return (
    <div className="loading-screen">
        <div className="spinner"></div>
        <p>Preparing your experience...</p>
    </div>
  )
  if (!hotel) return <div className="error-screen">Hotel not found</div>

  // --- DATA MAPPING HELPERS ---
  
  // 1. Images: Use DB photos array if available, else fallback
  let images = [];
  if (Array.isArray(hotel.photos) && hotel.photos.length > 0) {
      images = hotel.photos;
  } else if (hotel.image_url) {
      images = [
          hotel.image_url,
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', // Fallback interior
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'  // Fallback detail
      ];
  } else {
      images = [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
      ];
  }

  // 2. Location: Construct string
  const locationDisplay = hotel.location || `${hotel.city || ''}, ${hotel.country || ''}`;

  // 3. Rating: Use new average field
  const ratingDisplay = hotel.rating_average || hotel.rating || 0;

  return (
    <div className="hotel-details-page">
      <div className="container">
        
        {/* --- HEADER --- */}
        <header className="aurelia-header">
            <div className="header-left">
                <div className="badges">
                    <span className="badge-pill"><Star size={14} fill="currentColor" /> Premium Partner</span>
                    <span className="badge-pill outline">{hotel.type || "Resort"}</span>
                </div>
                <h1 className="hotel-title">{hotel.name}</h1>
                <div className="hotel-location">
                    <MapPin size={18} className="text-primary" /> 
                    {locationDisplay} • <span className="link-text">Show on map</span>
                </div>
            </div>
            <div className="header-right">
                 <div className="rating-box">
                     <div className="rating-info">
                         <span className="rating-status">Exceptional</span>
                         <span className="rating-count">{hotel.total_reviews || 124} verified reviews</span>
                     </div>
                     <span className="rating-score">{Number(ratingDisplay).toFixed(1)}</span>
                 </div>
            </div>
        </header>

        {/* --- GALLERY --- */}
        <div className="modern-gallery">
            <div className="gallery-main">
                <img src={images[0]} alt="Main View" />
                <button className="view-all-btn">View all photos</button>
            </div>
            <div className="gallery-side">
                {images[1] && <img src={images[1]} alt="Interior" />}
                {images[2] && (
                    <div className="img-overlay-wrapper">
                        <img src={images[2]} alt="Detail" />
                    </div>
                )}
            </div>
        </div>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="content-grid">
            
            {/* LEFT COLUMN: Details & Rooms */}
            <div className="details-column">
                
                {/* 1. Description & Amenities */}
                <section className="info-card">
                    <div className="host-info">
                        <div className="host-text">
                            <h2>About this stay</h2>
                            <p className="description-text">{hotel.description || "Experience the pinnacle of local hospitality..."}</p>
                        </div>
                    </div>

                    <div className="amenities-grid">
                         {/* Static Visual Icons for UI Consistency */}
                         <div className="amenity-item"><Wifi size={20}/> <span>High-speed WiFi</span></div>
                         <div className="amenity-item"><Car size={20}/> <span>Free Valet Parking</span></div>
                         <div className="amenity-item"><Utensils size={20}/> <span>Restaurant</span></div>
                         <div className="amenity-item"><Monitor size={20}/> <span>Smart TV</span></div>
                         <div className="amenity-item"><ShieldCheck size={20}/> <span>24/7 Security</span></div>
                         <div className="amenity-item"><Coffee size={20}/> <span>Breakfast Inc.</span></div>
                    </div>
                    
                    {/* Dynamic DB Facilities List (if available) */}
                    {Array.isArray(hotel.facilities) && hotel.facilities.length > 0 && (
                        <div className="dynamic-tags">
                            {hotel.facilities.map((fac, i) => (
                                <span key={i} className="facility-tag">{fac}</span>
                            ))}
                        </div>
                    )}
                </section>

                {/* 2. ROOM SELECTION */}
                <section id="rooms-section" ref={roomsRef} className="rooms-section">
                    <h2 className="section-header">Select your accommodation</h2>
                    <div className="room-cards-list">
                        {rooms.map((room) => {
                            const isSelected = selectedRoomId === (room._id || room.id);
                            const priceDisplay = parseFloat(room.price_per_night || room.price || 0);
                            const capacity = room.capacity || room.maxPeople || 2;
                            
                            return (
                                <div 
                                    key={room._id || room.id} 
                                    className={`room-card-interactive ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleRoomSelect(room)}
                                >
                                    <div className="room-content">
                                        <div className="room-header-flex">
                                            <h3>{room.title || room.name}</h3>
                                            <span className="room-capacity"><Users size={16}/> {capacity} Guests</span>
                                        </div>
                                        <p className="room-desc">{room.description || room.desc || "A spacious room with king size bed and city view."}</p>
                                        
                                        <div className="room-perks">
                                            {/* Map dynamic room amenities if available, else static */}
                                            {Array.isArray(room.facilities) && room.facilities.length > 0 ? (
                                                room.facilities.slice(0, 2).map((fac, i) => (
                                                    <span key={i}><Check size={14} className="text-green"/> {fac}</span>
                                                ))
                                            ) : (
                                                <>
                                                    <span><Check size={14} className="text-green"/> Free Cancellation</span>
                                                    <span><Check size={14} className="text-green"/> Breakfast included</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="room-action">
                                        <div className="price-tag-room">
                                            <span className="currency">$</span>
                                            <span className="amount">{priceDisplay}</span>
                                            <span className="period">/night</span>
                                        </div>
                                        <button className={`select-btn ${isSelected ? 'selected' : ''}`}>
                                            {isSelected ? 'Selected' : 'Select Room'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>

            {/* RIGHT COLUMN: Sticky Booking Widget */}
            <div className="sidebar-column">
                <div className="booking-card-glass">
                    <div className="card-top-accent"></div>
                    
                    <div className="booking-header-row">
                        <div>
                             <span className="price-large">
                                ${totalPrice > 0 ? totalPrice.toFixed(0) : (parseFloat(hotel.price || 0))}
                            </span>
                            <span className="price-unit">
                                 {nightCount > 0 ? ` total for ${nightCount} nights` : ' starting price'}
                            </span>
                        </div>
                        <div className="rating-micro">
                            <Star size={14} fill="#fbbf24" stroke="none" /> {Number(ratingDisplay).toFixed(1)}
                        </div>
                    </div>

                    <div className="date-picker-modern">
                        <div className="date-field top-left">
                            <label>CHECK-IN</label>
                            <div className="input-with-icon">
                                <Calendar size={14}/>
                                <input type="date" value={dates.checkIn} onChange={(e) => setDates({...dates, checkIn: e.target.value})} />
                            </div>
                        </div>
                        <div className="date-field top-right">
                            <label>CHECK-OUT</label>
                            <div className="input-with-icon">
                                <Calendar size={14}/>
                                <input type="date" value={dates.checkOut} onChange={(e) => setDates({...dates, checkOut: e.target.value})} />
                            </div>
                        </div>
                        <div className="guests-field">
                             <label>GUESTS</label>
                             <select className="guest-select" value={guests.adults} onChange={e => setGuests({...guests, adults: parseInt(e.target.value)})}>
                                 <option value="1">1 Adult</option>
                                 <option value="2">2 Adults</option>
                                 <option value="3">3 Adults</option>
                                 <option value="4">4 Adults</option>
                             </select>
                        </div>
                    </div>

                    <div className="cost-breakdown">
                         {selectedRoomId ? (
                            <div className="room-feedback success">
                                <Check size={16} /> Room selected
                            </div>
                         ) : (
                             <div className="room-feedback warning">
                                <Info size={16} /> Please select a room type
                             </div>
                         )}
                    </div>

                    <button className="reserve-btn-gradient" onClick={handleReserve}>
                        {selectedRoomId ? 'Reserve Now' : 'Check Availability'}
                        <ArrowRight size={18} />
                    </button>
                    
                    <div className="trust-footer">
                        <span><ShieldCheck size={14}/> Secure booking</span>
                        <span>No charge yet</span>
                    </div>
                </div>
            </div>
            
        </div>
      </div>
    </div>
  )
}

export default HotelDetails