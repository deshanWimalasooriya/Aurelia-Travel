import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import './styles/hotelDetails.css'

const HotelDetails = () => {
  const { id } = useParams()
  const [hotel, setHotel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    roomType: ''
  })

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('🔍 Fetching hotel ID:', id)
        
        const response = await axios.get(`http://localhost:5000/api/hotels/${id}`)
        console.log('✅ Hotel Response:', response.data)
        
        // Handle backend response structure
        const hotelData = Array.isArray(response.data) ? response.data[0] : response.data
        setHotel(hotelData)
        
      } catch (err) {
        console.error('❌ Error fetching hotel:', err.response?.data || err.message)
        setError(err.response?.data?.message || 'Hotel not found')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchHotel()
    }
  }, [id])

  if (loading) {
    return (
      <div className="hotel-details-page min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg">Loading hotel details...</div>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="hotel-details-page hotel-details-not-found min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-red-500 mb-4">Hotel Not Found</h2>
          <button 
            onClick={() => window.history.back()} 
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            ← Back to Hotels
          </button>
        </div>
      </div>
    )
  }

  // Parse amenities from backend comma-separated string
  const amenities = hotel.amenities 
    ? hotel.amenities.split(',').map(a => a.trim())
    : ['Free WiFi', 'Swimming Pool', 'Parking', 'Air Conditioning', 'Restaurant']

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBookingData(prev => ({ ...prev, [name]: value }))
  }

  const handleBookNow = () => {
    console.log('Booking submitted:', { hotelId: hotel.id, ...bookingData })
    // TODO: Send to backend booking API
  }

  return (
    <div className="hotel-details-page">
      <div className="hotel-details-container">
        <div className="hotel-details-grid">
          {/* Image Gallery */}
          <div className="hotel-gallery">
            <div className="hotel-main-image">
              <img
                src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                alt={hotel.name}
                className="hotel-image"
              />
            </div>
            
            <div className="hotel-thumbnails">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="hotel-thumbnail"
                  onClick={() => setSelectedImage(i)}
                >
                  <img
                    src={`https://images.unsplash.com/photo-${i*100}?w=200`}
                    alt={`Gallery ${i}`}
                    className="thumbnail-image"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Booking Form */}
          <div className="hotel-booking-form">
            <h2 className="booking-title">{hotel.name}</h2>
            <p className="booking-location">{hotel.location}</p>
            
            <div className="booking-price">
              <span className="price-amount">${parseFloat(hotel.price).toFixed(2)}</span>
              <span className="price-label">per night</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleBookNow(); }} className="booking-form">
              <div className="form-group">
                <label className="form-label">Check-in</label>
                <input
                  type="date"
                  name="checkIn"
                  value={bookingData.checkIn}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Check-out</label>
                <input
                  type="date"
                  name="checkOut"
                  value={bookingData.checkOut}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select
                  name="roomType"
                  value={bookingData.roomType}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">Select room type</option>
                  <option value="deluxe">Deluxe Room</option>
                  <option value="suite">Suite</option>
                  <option value="premium">Premium Room</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Guests</label>
                <div className="guests-inputs">
                  <div className="guest-input">
                    <label className="guest-label">Adults</label>
                    <input
                      type="number"
                      name="adults"
                      value={bookingData.adults}
                      onChange={handleInputChange}
                      min="1"
                      className="guest-number"
                    />
                  </div>
                  <div className="guest-input">
                    <label className="guest-label">Children</label>
                    <input
                      type="number"
                      name="children"
                      value={bookingData.children}
                      onChange={handleInputChange}
                      min="0"
                      className="guest-number"
                    />
                  </div>
                </div>
              </div>
              
              <button type="submit" className="booking-btn">
                Book Now
              </button>
            </form>
          </div>
        </div>

        {/* Hotel Details */}
        <div className="hotel-info-section">
          <div className="hotel-about">
            <h3 className="section-title">About {hotel.name}</h3>
            <p className="hotel-description">{hotel.description}</p>
            
            <h4 className="section-subtitle">Amenities</h4>
            <div className="amenities-grid">
              {amenities.map(amenity => (
                <div key={amenity} className="amenity-item">
                  <span className="amenity-check">✓</span>
                  <span className="amenity-name">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hotel-reviews">
            <h3 className="section-title">Reviews</h3>
            <div className="reviews-list">
              {[1, 2, 3].map(i => (
                <div key={i} className="review-item">
                  <div className="review-header">
                    <span className="review-user">Guest {i}</span>
                    <span className="review-rating">⭐ {hotel.rating || 4}.{i}</span>
                  </div>
                  <p className="review-comment">
                    Great stay at {hotel.name}! Clean rooms and excellent service.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HotelDetails
