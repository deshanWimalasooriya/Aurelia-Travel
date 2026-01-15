import { Star, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import './styles/HotelCard.css'

const HotelCard = ({ hotel }) => {
  // Database fields might be rating_average OR rating depending on the query
  const rating = hotel.rating_average || hotel.rating || 0;
  
  // Construct location if the direct field is missing
  const locationDisplay = hotel.location || `${hotel.city || ''}, ${hotel.country || ''}`;
  
  // Handle price display
  const startPrice = parseFloat(hotel.price || 0);

  return (
    <div className="hotel-card">
      <div className="hotel-image-container">
        <img 
          src={hotel.image_url} 
          alt={hotel.name}
          className="hotel-image"
        />
        {rating > 0 && (
            <div className="hotel-rating">
            {rating} <Star size={12} fill="white" stroke="none" style={{marginLeft: '4px'}}/>
            </div>
        )}
      </div>
      
      <div className="hotel-info">
        <h3 className="hotel-name">{hotel.name}</h3>
        
        <div className="hotel-location">
          <MapPin className="location-icon" size={16} />
          <span>{locationDisplay}</span>
        </div>
        
        <div className="hotel-details">
          {/* Rating Section */}
          <div className="hotel-rating-info">
             <div className="stars-flex">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={14} 
                        className={i < Math.round(rating) ? "star-filled" : "star-empty"} 
                        fill={i < Math.round(rating) ? "#fbbf24" : "none"}
                        stroke={i < Math.round(rating) ? "#fbbf24" : "#cbd5e1"}
                    />
                ))}
             </div>
             <span className="review-count">({hotel.total_reviews || 0} reviews)</span>
          </div>

          {/* Price Section */}
          <div className="hotel-price">
            {startPrice > 0 ? (
                <>
                    <span className="price-label">from</span>
                    <span className="price-value">${startPrice.toFixed(0)}</span>
                </>
            ) : (
                <span className="price-value-hidden">View Rates</span>
            )}
          </div>
        </div>
        
        <div className="hotel-actions">
          {startPrice > 0 && <span className="price-period">per night</span>}
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