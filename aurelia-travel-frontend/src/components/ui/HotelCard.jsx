import { Star, MapPin, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import './styles/HotelCard.css'

const HotelCard = ({ hotel }) => {
  return (
    <div className="hotel-card">
      <div className="hotel-image-container">
        <img 
          src={hotel.image_url} 
          alt={hotel.name}
          className="hotel-image"
        />
        <div className="hotel-rating">
          {hotel.star_rating} ⭐
        </div>
      </div>
      
      <div className="hotel-info">
        <h3 className="hotel-name">{hotel.name}</h3>
        
        <div className="hotel-location">
          <MapPin className="location-icon" />
          <span>{hotel.location}</span>
        </div>
        
        <div className="hotel-details">
          <div className="hotel-rating-info">
            <Star className="rating-icon" />
            <span className="rating-value">{hotel.rating}</span>
          </div>
          <div className="hotel-price">
            <span className="price-value">${hotel.price}</span>
          </div>
        </div>
        
        <div className="hotel-actions">
          <span className="price-label">per night</span>
          <Link 
            to={`/hotel/${hotel.id}`}
            className="view-details-btn"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HotelCard
