import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { mockHotels } from '../data/mockHotels'
import './styles/hotelDetails.css'

const HotelDetails = () => {
  const { id } = useParams()
  const [hotel, setHotel] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    roomType: ''
  })

  useEffect(() => {
    const foundHotel = mockHotels.find(h => h.id === parseInt(id))
    setHotel(foundHotel)
  }, [id])

  if (!hotel) {
    return <div className="hotel-details-page hotel-details-not-found">Hotel not found</div>
  }

  const amenities = [
    'Free WiFi', 'Swimming Pool', 'Parking', 'Air Conditioning', 'Restaurant',
    'Bar', 'Spa', 'Fitness Center', 'Room Service', 'Laundry'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBookingData(prev => ({ ...prev, [name]: value }))
  }

  const handleBookNow = () => {
    console.log('Booking submitted:', bookingData)
  }

  return (
    <div className="hotel-details-page">
      <div className="hotel-details-container">
        <div className="hotel-details-grid">
          {/* Image Gallery */}
          <div className="hotel-gallery">
            <div className="hotel-main-image">
              <img
                src={hotel.image_url}
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
                    src={`https://images.unsplash.com/photo-${i}?w=200`}
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
              <span className="price-amount">${hotel.price}</span>
              <span className="price-label">per night</span>
            </div>

            <form onSubmit={handleBookNow} className="booking-form">
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
                    <span className="review-user">User {i}</span>
                    <span className="review-rating">⭐ 4.{i}</span>
                  </div>
                  <p className="review-comment">
                    Great experience at {hotel.name}. The staff was very helpful and the room was clean and comfortable.
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
