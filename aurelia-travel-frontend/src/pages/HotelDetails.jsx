import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom' // Added useNavigate
import axios from 'axios'
import { MapPin, Wifi, Car, Coffee, Star, Check, Users, Home, Info, Calendar } from 'lucide-react'
import { useUser } from '../context/UserContext' // Import User Context
import './styles/hotelDetails.css'

const HotelDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate() // Hook for redirection
  const { user } = useUser() // Get current user
  
  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Selection State
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [totalPrice, setTotalPrice] = useState(0)
  
  // Booking Data State
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' })
  const [guests, setGuests] = useState({ adults: 2, children: 0 }) // Added Guest State

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

  const handleRoomSelect = (room) => {
    if (selectedRoomId === (room._id || room.id)) {
        setSelectedRoomId(null);
        setTotalPrice(0);
    } else {
        setSelectedRoomId(room._id || room.id);
        setTotalPrice(room.price);
    }
  };

  // --- NEW: HANDLE RESERVATION ---
  const handleReserve = async () => {
    // 1. Validation
    if (!user) {
        alert("You must be logged in to reserve a room!");
        navigate('/auth'); // Redirect to login
        return;
    }
    if (!selectedRoomId) {
        alert("Please select a room first.");
        return;
    }
    if (!dates.checkIn || !dates.checkOut) {
        alert("Please select Check-in and Check-out dates.");
        return;
    }

    try {
        // 2. Prepare Payload
        const bookingPayload = {
            room_id: selectedRoomId,
            check_in: dates.checkIn,
            check_out: dates.checkOut,
            adults: guests.adults,
            children: guests.children,
            total_price: totalPrice,
            status: "confirmed" // Since there is no payment, we confirm immediately
        };

        console.log("📤 Sending Booking:", bookingPayload);

        // 3. Send to Backend
        const res = await axios.post('http://localhost:5000/api/bookings', bookingPayload, {
            withCredentials: true // Important: Sends the user's token/cookie
        });

        // 4. Handle Success
        if (res.status === 200 || res.status === 201) {
            alert("🎉 Reservation Successful! You can view it in your profile.");
            navigate('/profile'); // Send user to their dashboard
        }

    } catch (err) {
        console.error("❌ Booking Error:", err);
        const errorMsg = err.response?.data?.message || "Failed to create reservation. Please try again.";
        alert(errorMsg);
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!hotel) return <div className="error-screen">Hotel not found</div>

  const images = hotel.photos?.length > 0 ? hotel.photos : [
    hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
  ];

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
            <div className="gallery-main">
                <img src={images[0]} alt="Main" />
            </div>
            <div className="gallery-side">
                <img src={images[1]} alt="Side 1" />
                <img src={images[2]} alt="Side 2" />
            </div>
        </div>

        <div className="content-grid">
            {/* LEFT CONTENT */}
            <div className="details-column">
                <div className="info-card">
                    <h2 className="section-title">About this stay</h2>
                    <p className="description-text">{hotel.description || "Experience the best of local hospitality..."}</p>
                    
                    <h3 className="subsection-title">Popular Amenities</h3>
                    <div className="amenities-pills">
                        <div className="pill"><Wifi size={16}/> Free WiFi</div>
                        <div className="pill"><Car size={16}/> Parking</div>
                        <div className="pill"><Coffee size={16}/> Breakfast</div>
                        <div className="pill"><Star size={16}/> Spa</div>
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
                                    return (
                                        <tr key={room._id || room.id} className={isSelected ? 'row-active' : ''} onClick={() => handleRoomSelect(room)}>
                                            <td>
                                                <div className="room-name">{room.title || room.name}</div>
                                                <div className="room-meta">{room.desc || "Standard Room"}</div>
                                            </td>
                                            <td>
                                                <div className="capacity-badge">
                                                    <Users size={14} /> {room.maxPeople || 2} Guests
                                                </div>
                                            </td>
                                            <td>
                                                <div className="benefit-item"><Check size={14} className="text-green"/> Free Cancellation</div>
                                            </td>
                                            <td><span className="price-text">${room.price}</span></td>
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

            {/* RIGHT STICKY SIDEBAR */}
            <div className="sidebar-column">
                <div className="booking-card">
                    <div className="booking-header">
                        <span className="price-large">${totalPrice > 0 ? totalPrice : (hotel.cheapestPrice || 0)}</span>
                        <span className="price-unit">/ night</span>
                    </div>

                    {/* Date Inputs */}
                    <div className="date-picker-mock">
                        <div className="date-input">
                            <label>Check-in</label>
                            <input type="date" onChange={(e) => setDates({...dates, checkIn: e.target.value})} />
                        </div>
                        <div className="date-input">
                            <label>Check-out</label>
                            <input type="date" onChange={(e) => setDates({...dates, checkOut: e.target.value})} />
                        </div>
                    </div>

                    {/* Selection Summary */}
                    <div className="selection-summary">
                        {selectedRoomId ? (
                            <div className="selected-msg success">
                                <Check size={16} /> Room Selected
                            </div>
                        ) : (
                            <div className="selected-msg warning">
                                <Info size={16} /> Please select a room
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <button 
                        className="btn-primary-large" 
                        disabled={!selectedRoomId}
                        onClick={handleReserve} // <--- Calls the backend
                    >
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