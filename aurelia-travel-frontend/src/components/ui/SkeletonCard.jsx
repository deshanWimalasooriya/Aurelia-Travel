import React from 'react';
import './styles/SkeletonCard.css';

const SkeletonCard = () => {
  return (
    <div className="hotel-card skeleton-card">
      {/* Image Placeholder */}
      <div className="skeleton-image skeleton-pulse"></div>
      
      <div className="hotel-info">
        {/* Title Placeholder */}
        <div className="skeleton-text title skeleton-pulse"></div>
        
        {/* Location Placeholder */}
        <div className="skeleton-text location skeleton-pulse"></div>
        
        {/* Details/Rating Placeholder */}
        <div className="hotel-details">
          <div className="skeleton-text rating skeleton-pulse"></div>
          <div className="skeleton-text price skeleton-pulse"></div>
        </div>
        
        {/* Button Placeholder */}
        <div className="hotel-actions">
           <div className="skeleton-btn skeleton-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;