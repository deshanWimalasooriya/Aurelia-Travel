import React from 'react';
import './styles/SkeletonCard.css'; // Reusing the pulse animation styles

const HotelDetailsSkeleton = () => {
  return (
    <div className="hotel-details-page">
      <div className="container">
        
        {/* 1. HEADER SKELETON */}
        <div className="header-section" style={{ borderBottom: 'none', paddingBottom: '20px' }}>
            <div className="hotel-headline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ width: '60%' }}>
                    {/* Title */}
                    <div className="skeleton-pulse" style={{ height: '40px', width: '70%', marginBottom: '15px', borderRadius: '8px' }}></div>
                    {/* Location & Rating */}
                    <div className="skeleton-pulse" style={{ height: '20px', width: '40%', borderRadius: '6px' }}></div>
                </div>
                {/* Price */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div className="skeleton-pulse" style={{ height: '16px', width: '40px', marginBottom: '8px', borderRadius: '4px' }}></div>
                    <div className="skeleton-pulse" style={{ height: '36px', width: '120px', borderRadius: '8px' }}></div>
                </div>
            </div>
        </div>

        {/* 2. HERO GRID SKELETON */}
        <div className="hero-split-section" style={{ height: '460px', marginBottom: '50px' }}>
            {/* Gallery Area */}
            <div className="gallery-container" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '12px', height: '100%' }}>
                {/* Main Image */}
                <div className="skeleton-pulse" style={{ width: '100%', height: '100%', borderRadius: '16px' }}></div>
                {/* Sub Images Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                    <div className="skeleton-pulse" style={{ flex: 1, borderRadius: '16px' }}></div>
                    <div className="skeleton-pulse" style={{ flex: 1, borderRadius: '16px' }}></div>
                    <div className="skeleton-pulse" style={{ flex: 1, borderRadius: '16px' }}></div>
                </div>
            </div>
            {/* Map Area */}
            <div className="map-container skeleton-pulse" style={{ borderRadius: '16px', height: '100%' }}></div>
        </div>

        {/* 3. CONTENT GRID SKELETON */}
        <div className="content-grid">
            
            {/* LEFT COLUMN */}
            <div className="details-content">
                
                {/* Description & Amenities Card */}
                <div className="section-card" style={{ padding: '40px' }}>
                    <div className="skeleton-pulse" style={{ height: '28px', width: '40%', marginBottom: '25px', borderRadius: '6px' }}></div>
                    
                    {/* Lines of text */}
                    <div className="skeleton-pulse" style={{ height: '14px', width: '100%', marginBottom: '10px', borderRadius: '4px' }}></div>
                    <div className="skeleton-pulse" style={{ height: '14px', width: '95%', marginBottom: '10px', borderRadius: '4px' }}></div>
                    <div className="skeleton-pulse" style={{ height: '14px', width: '90%', marginBottom: '30px', borderRadius: '4px' }}></div>
                    
                    {/* Amenities Title */}
                    <div className="skeleton-pulse" style={{ height: '20px', width: '25%', marginBottom: '15px', borderRadius: '4px' }}></div>
                    
                    {/* Amenities Pills */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="skeleton-pulse" style={{ height: '40px', width: '130px', borderRadius: '10px' }}></div>
                        ))}
                    </div>
                </div>

                {/* Rooms Table Skeleton */}
                <div className="section-card">
                    <div className="skeleton-pulse" style={{ height: '28px', width: '35%', marginBottom: '25px', borderRadius: '6px' }}></div>
                    
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        {/* Table Header */}
                        <div style={{ height: '50px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}></div>
                        
                        {/* Table Rows */}
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: '110px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '20px' }}>
                                {/* Thumbnail */}
                                <div className="skeleton-pulse" style={{ width: '80px', height: '60px', borderRadius: '8px', flexShrink: 0 }}></div>
                                
                                {/* Room Info */}
                                <div style={{ flex: 2 }}>
                                    <div className="skeleton-pulse" style={{ height: '18px', width: '60%', marginBottom: '8px', borderRadius: '4px' }}></div>
                                    <div className="skeleton-pulse" style={{ height: '14px', width: '40%', borderRadius: '4px' }}></div>
                                </div>
                                
                                {/* Capacity */}
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton-pulse" style={{ height: '16px', width: '60%', borderRadius: '4px' }}></div>
                                </div>

                                {/* Price & Button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div className="skeleton-pulse" style={{ height: '24px', width: '80px', borderRadius: '4px' }}></div>
                                    <div className="skeleton-pulse" style={{ height: '36px', width: '90px', borderRadius: '8px' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR SKELETON */}
            <div className="sidebar-column">
                <div className="booking-widget" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    {/* Price Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div className="skeleton-pulse" style={{ height: '32px', width: '100px', borderRadius: '6px' }}></div>
                        <div className="skeleton-pulse" style={{ height: '24px', width: '80px', borderRadius: '100px' }}></div>
                    </div>
                    
                    {/* Date Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div className="skeleton-pulse" style={{ height: '50px', borderRadius: '8px' }}></div>
                        <div className="skeleton-pulse" style={{ height: '50px', borderRadius: '8px' }}></div>
                    </div>
                    
                    {/* Guest Select */}
                    <div className="skeleton-pulse" style={{ height: '50px', width: '100%', marginBottom: '20px', borderRadius: '8px' }}></div>
                    
                    {/* Button */}
                    <div className="skeleton-pulse" style={{ height: '54px', width: '100%', borderRadius: '12px' }}></div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default HotelDetailsSkeleton;