import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { MapPin, Wifi, Car, Coffee, Star, Check, Users, Info } from 'lucide-react'
import { useUser } from '../context/UserContext'
import './styles/hotelDetails.css'

const HotelDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  
  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [totalPrice, setTotalPrice] = useState(0)
  
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
        
        setHotel(Array.isArray(hotelRes.data) ? hotelRes.data[0] : hotelRes.data);
        setRooms(Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data.data || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

  // --- 2. HELPER: CALCULATE NIGHTS ---
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  // --- 3. AUTO-UPDATE PRICE (FIXED) ---
  useEffect(() => {
    if (selectedRoomId) {
        const room = rooms.find(r => (r._id || r.id) === selectedRoomId);
        if (room) {
            // FIX 1: Handle different database column names (price vs price_per_night)
            const roomPrice = room.price || room.price_per_night || 0;
            
            const nights = calculateDays(dates.checkIn, dates.checkOut);
            
            // FIX 2: If 0 nights (same day), charge for 1 night
            const effectiveNights = nights > 0 ? nights : 1;
            
            const calculatedTotal = roomPrice * effectiveNights;
            
            console.log("💰 Calculating Price:", { roomPrice, nights, effectiveNights, calculatedTotal }); // Debug log
            setTotalPrice(calculatedTotal);
        }
    } else {
        setTotalPrice(0);
    }
  }, [selectedRoomId, dates, rooms]);

  const handleRoomSelect = (room) => {
    if (selectedRoomId === (room._id || room.id)) {
        setSelectedRoomId(null);
    } else {
        setSelectedRoomId(room._id || room.id);
    }
  };

  const handleReserve = async () => {
    if (!user) { alert("Please login."); navigate('/auth'); return; }
    if (!selectedRoomId) { alert("Please select a room."); return; }
    if (!dates.checkIn || !dates.checkOut) { alert("Please select dates."); return; }

    // FIX 3: Safety check for undefined price
    if (!totalPrice || totalPrice <= 0) {
        alert("Error calculating price. Please re-select dates.");
        return;
    }

    try {
        const bookingPayload = {
            room_id: selectedRoomId,
            check_in: dates.checkIn,
            check_out: dates.checkOut,
            adults: guests.adults,
            children: guests.children,
            total_price: totalPrice, // This relies on the state updated by useEffect
            status: "confirmed"
        };

        console.log("📤 Sending Booking Payload:", bookingPayload);

        const res = await axios.post('http://localhost:5000/api/bookings', bookingPayload, {
            withCredentials: true 
        });

        if (res.status === 200 || res.status === 201) {
            alert("🎉 Reservation Successful!");
            navigate('/profile'); 
        }

    } catch (err) {
        console.error("❌ Booking Error:", err);
        alert(err.response?.data?.message || "Booking Failed");
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!hotel) return <div className="error-screen">Hotel not found</div>

  const images = hotel.photos?.length > 0 ? hotel.photos : [
    hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
  ];

  const nightCount = calculateDays(dates.checkIn, dates.checkOut);

  return (
    <div className="hotel-details-page">
      <div className="container">
        
        {/* HEADER */}
        <div className="aurelia-header">
            <div>
                <h1 className="hotel-title">{hotel.name}</h1>
                <div className="hotel-location">
                    <MapPin size={18} className="text-primary" /> {hotel.location}
                </div>
            </div>
            <div className="rating-box">
                <span className="rating-score">4.8</span>
                <div className="rating-text">
                    <span className="rating-status">Excellent</span>
                    <span className="rating-count">124 reviews</span>
                </div>
            </div>
        </div>

        {/* GALLERY */}
        <div className="modern-gallery">
            <div className="gallery-main"><img src={images[0]} alt="Main" /></div>
            <div className="gallery-side">
                <img src={images[1]} alt="Side 1" />
                <img src={images[2]} alt="Side 2" />
            </div>
        </div>

        <div className="content-grid">
            <div className="details-column">
                <div className="info-card">
                    <h2 className="section-title">About this stay</h2>
                    <p className="description-text">{hotel.description || "Experience local hospitality..."}</p>
                    <h3 className="subsection-title">Amenities</h3>
                    <div className="amenities-pills">
                        <div className="pill"><Wifi size={16}/> Free WiFi</div>
                        <div className="pill"><Car size={16}/> Parking</div>
                        <div className="pill"><Coffee size={16}/> Breakfast</div>
                    </div>
                </div>

                {/* ROOM TABLE */}
                <div id="rooms-section" className="rooms-section">
                    <h2 className="section-title">Choose your Room</h2>
                    <div className="table-wrapper">
                        <table className="aurelia-table">
                            <thead>
                                <tr>
                                    <th>Room Type</th>
                                    <th>Capacity</th>
                                    <th>Benefits</th>
                                    <th>Price</th>
                                    <th>Select</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map((room) => {
                                    const isSelected = selectedRoomId === (room._id || room.id);
                                    // FIX 4: Display price safely in table
                                    const displayPrice = room.price || room.price_per_night || 0;
                                    return (
                                        <tr key={room._id || room.id} className={isSelected ? 'row-active' : ''} onClick={() => handleRoomSelect(room)}>
                                            <td>
                                                <div className="room-name">{room.title || room.name}</div>
                                                <div className="room-meta">{room.desc || "Standard Room"}</div>
                                            </td>
                                            <td><div className="capacity-badge"><Users size={14} /> {room.maxPeople || 2} Guests</div></td>
                                            <td><div className="benefit-item"><Check size={14} className="text-green"/> Free Cancellation</div></td>
                                            <td><span className="price-text">${displayPrice}</span></td>
                                            <td>
                                                <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                                                    {isSelected && <Check size={14} color="white" />}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* SIDEBAR */}
            <div className="sidebar-column">
                <div className="booking-card">
                    <div className="booking-header">
                        <span className="price-large">
                            ${totalPrice > 0 ? totalPrice : (hotel.cheapestPrice || 0)}
                        </span>
                        <span className="price-unit">
                             {nightCount > 0 ? ` / total (${nightCount} nights)` : ' / night'}
                        </span>
                    </div>

                    <div className="date-picker-mock">
                        <div className="date-input">
                            <label>Check-in</label>
                            <input type="date" value={dates.checkIn} onChange={(e) => setDates({...dates, checkIn: e.target.value})} />
                        </div>
                        <div className="date-input">
                            <label>Check-out</label>
                            <input type="date" value={dates.checkOut} onChange={(e) => setDates({...dates, checkOut: e.target.value})} />
                        </div>
                    </div>

                    <button className="btn-primary-large" disabled={!selectedRoomId} onClick={handleReserve}>
                        {selectedRoomId ? 'Reserve Now' : 'Check Availability'}
                    </button>
                    <p className="micro-text">No payment required today</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}

export default HotelDetails