import { Star, MapPin, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../../context/WishlistContext'; 
import './styles/HotelCard.css'

const HotelCard = ({ hotel }) => {
  const rating = hotel.rating_average || hotel.rating || 0;
  const locationDisplay = hotel.location || `${hotel.city || ''}, ${hotel.country || ''}`;
  const startPrice = parseFloat(hotel.price || hotel.price_per_night_from || hotel.base_price_per_night || 0);

  const { isInWishlist, toggleWishlist } = useWishlist(); 
  const isSaved = isInWishlist(hotel.id);

  return (
    <div className="hotel-card">
      <div className="hotel-image-container">
        <img 
          src={hotel.main_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'} 
          alt={hotel.name}
          className="hotel-image"
        />
        {rating > 0 && (
            <div className="hotel-rating-badge">
                <Star size={12} fill="white" stroke="none" />
                <span>{rating}</span>
            </div>
        )}
        
        {/* Wishlist Button - Premium Float */}
        <button 
            className={`wishlist-btn-floating ${isSaved ? 'saved' : ''}`} 
            onClick={(e) => {
                e.preventDefault(); 
                toggleWishlist(hotel);
            }}
            title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart size={18} fill={isSaved ? "#ef4444" : "none"} color={isSaved ? "#ef4444" : "#64748b"} />
        </button>
      </div>

      {/* --- NEW WISHLIST BUTTON --- */}
        <button 
            className="wishlist-btn" 
            onClick={(e) => {
                e.preventDefault(); // Prevent navigating to details
                toggleWishlist(hotel);
            }}
            style={{
                position: 'absolute', top: 12, right: 12,
                background: 'white', border: 'none', borderRadius: '50%',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
        >
            <Heart size={18} fill={isSaved ? "#ef4444" : "none"} color={isSaved ? "#ef4444" : "#64748b"} />
        </button>
        {/* --------------------------- */}
      
      <div className="hotel-info">
        <div className="hotel-title-row">
            <h3 className="hotel-name">{hotel.name}</h3>
        </div>
        
        <div className="hotel-location">
          <MapPin className="location-icon" size={14} />
          <span>{locationDisplay}</span>
        </div>
        
        <div className="hotel-details-footer">
          <div className="hotel-rating-info">
             <div className="stars-flex">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={12} 
                        fill={i < Math.round(rating) ? "var(--color-accent)" : "none"}
                        stroke={i < Math.round(rating) ? "var(--color-accent)" : "#cbd5e1"}
                    />
                ))}
             </div>
             <span className="review-count">({hotel.total_reviews || 0})</span>
          </div>

          <div className="hotel-price-block">
            {startPrice > 0 ? (
                <>
                    <span className="price-label">from</span>
                    <span className="price-value">${startPrice.toFixed(0)}</span>
                    <span className="price-period">/night</span>
                </>
            ) : (
                <span className="price-value-hidden">View Rates</span>
            )}
          </div>
        </div>
        
        <Link to={`/hotel/${hotel.id}`} className="btn-view-details">
            Reserve
        </Link>
      </div>
    </div>
  )
}

export default HotelCard