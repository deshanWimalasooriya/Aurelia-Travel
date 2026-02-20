import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import HotelCard from '../components/ui/HotelCard';
import { Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './styles/wishlist.css'; // We will create this next

const WishlistPage = () => {
  const { wishlist, clearWishlist } = useWishlist();

  return (
    <div className="wishlist-page-wrapper">
      <div className="container">
        
        {/* Header */}
        <div className="wishlist-header">
          <div>
              <h1 className="wishlist-title">
                  <Heart className="wishlist-title-icon" fill="currentColor" /> My Wishlist
              </h1>
              <p className="wishlist-subtitle">
                  {wishlist.length} {wishlist.length === 1 ? 'property' : 'properties'} saved for later
              </p>
          </div>
          
          {wishlist.length > 0 && (
              <button 
                  className="btn-clear-wishlist"
                  onClick={() => {
                      if(window.confirm('Are you sure you want to clear your wishlist?')) clearWishlist();
                  }}
              >
                  <Trash2 size={18} /> Clear All
              </button>
          )}
        </div>

        {/* Grid */}
        {wishlist.length > 0 ? (
          <div className="hotel-grid-modern"> 
              {wishlist.map(hotel => (
                  <div className="hotel-card-wrapper" key={hotel.id}>
                      <HotelCard hotel={hotel} />
                  </div>
              ))}
          </div>
        ) : (
          <div className="wishlist-empty-state">
              <div className="empty-icon-wrapper">
                  <Heart size={48} />
              </div>
              <h3>Your wishlist is empty</h3>
              <p>Save properties you love to view them here.</p>
              <Link to="/hotel-showcase" className="btn-primary-glow" style={{marginTop: '24px', display: 'inline-block'}}>
                  Explore Hotels
              </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;