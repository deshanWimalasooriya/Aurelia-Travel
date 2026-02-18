import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import HotelCard from '../components/ui/HotelCard';
import { Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const WishlistPage = () => {
  const { wishlist, clearWishlist } = useWishlist();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', minHeight: '80vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Heart fill="#ef4444" color="#ef4444" /> My Wishlist
            </h1>
            <p style={{ color: '#64748b', marginTop: '5px' }}>
                {wishlist.length} {wishlist.length === 1 ? 'property' : 'properties'} saved for later
            </p>
        </div>
        
        {wishlist.length > 0 && (
            <button 
                onClick={() => {
                    if(window.confirm('Are you sure you want to clear your wishlist?')) clearWishlist();
                }}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', border: '1px solid #fee2e2',
                    background: '#fff', color: '#ef4444', borderRadius: '8px',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseOut={e => e.currentTarget.style.background = '#fff'}
            >
                <Trash2 size={18} /> Clear All
            </button>
        )}
      </div>

      {/* Grid */}
      {wishlist.length > 0 ? (
        <div className="hotel-grid-modern"> {/* Reusing your existing grid class from HotelPage.css */}
            {wishlist.map(hotel => (
                <div className="hotel-card-wrapper" key={hotel.id}>
                    <HotelCard hotel={hotel} />
                </div>
            ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <Heart size={60} style={{ opacity: 0.2, marginBottom: '20px' }} />
            <h3>Your wishlist is empty</h3>
            <p>Save properties you love to view them here.</p>
            <Link 
                to="/hotels" 
                style={{ 
                    marginTop: '20px', display: 'inline-block', 
                    padding: '12px 24px', background: '#3b82f6', color: 'white', 
                    borderRadius: '8px', textDecoration: 'none', fontWeight: 600 
                }}
            >
                Explore Hotels
            </Link>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;