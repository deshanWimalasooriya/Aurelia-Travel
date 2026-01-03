import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, MapPin, Star, Filter, Loader2, AlertCircle } from 'lucide-react';
import './styles/hotelPage.css';

const HotelPage = () => {
  // --- STATE MANAGEMENT ---
  const [hotels, setHotels] = useState([]); // Raw data from backend
  const [filteredHotels, setFilteredHotels] = useState([]); // Data displayed to user
  
  // UI States (Matches your Home.jsx pattern)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Static Data for Filters
  const AVAILABLE_FEATURES = ["Free WiFi", "Pool", "Spa", "Gym", "Restaurant", "Parking", "Bar", "AC"];
  const DISTRICTS = ["Colombo", "Galle", "Kandy", "Tokyo", "London", "New York"];
  const COUNTRIES = ["Sri Lanka", "Japan", "UK", "USA"];

  // --- 1. FETCH DATA (Adapted from Home.jsx) ---
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching all hotels from backend...');
        
        // Call the 'get all hotels' endpoint
        const response = await axios.get('http://localhost:5000/api/hotels');
        
        console.log('✅ Hotels Response:', response.data);

        // Handle different backend response structures (Array vs Object with data key)
        const hotelData = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        setHotels(hotelData);
        setFilteredHotels(hotelData); // Initially, filtered list = all hotels
        
      } catch (err) {
        console.error('❌ Error fetching hotels:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load hotels');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  // --- 2. FILTER LOGIC (Runs whenever filters change) ---
  useEffect(() => {
    let result = hotels;

    // Filter by Search Term (Name or Location)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(hotel => 
        (hotel.name?.toLowerCase() || "").includes(lowerTerm) || 
        (hotel.location?.toLowerCase() || "").includes(lowerTerm)
      );
    }

    // Filter by Country
    if (selectedCountry) {
      result = result.filter(hotel => hotel.country === selectedCountry);
    }

    // Filter by District
    if (selectedDistrict) {
      result = result.filter(hotel => hotel.district === selectedDistrict);
    }

    // Filter by Features
    if (selectedFeatures.length > 0) {
      result = result.filter(hotel => {
        const hotelFeatures = hotel.features || [];
        // Check if hotel has ALL selected features
        return selectedFeatures.every(feature => hotelFeatures.includes(feature));
      });
    }

    setFilteredHotels(result);
  }, [searchTerm, selectedCountry, selectedDistrict, selectedFeatures, hotels]);

  // --- HANDLERS ---
  const toggleFeature = (feature) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature) 
        : [...prev, feature]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCountry("");
    setSelectedDistrict("");
    setSelectedFeatures([]);
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg flex items-center gap-2">
           <Loader2 className="animate-spin" /> Loading hotels...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <p className="text-red-500 mb-4 flex items-center gap-2">
            <AlertCircle /> {error}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="hotel-page container min-h-screen">
      
      {/* HEADER SECTION */}
      <section className="hotel-header">
        <h1>Find your perfect stay</h1>
        <p>Search through our exclusive collection of hotels.</p>
        
        <div className="search-bar-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search by hotel name or location..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <div className="hotel-content-grid">
        
        {/* --- SIDEBAR FILTERS --- */}
        <aside className="filters-sidebar card">
          <div className="filter-header">
            <h3><Filter size={18} /> Filters</h3>
            <button className="btn-link" onClick={clearFilters}>Reset</button>
          </div>

          <div className="filter-group">
            <label>Country</label>
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
              <option value="">All Countries</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>District / City</label>
            <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
              <option value="">All Districts</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="divider"></div>

          <div className="filter-group">
            <label>Features</label>
            <div className="checkbox-list">
              {AVAILABLE_FEATURES.map(feature => (
                <label key={feature} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={selectedFeatures.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                  />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* --- HOTEL LISTINGS --- */}
        <main className="hotel-listings">
          <div className="listings-header">
            <h2>{filteredHotels.length} Hotels Found</h2>
          </div>

          {filteredHotels.length > 0 ? (
            <div className="hotel-grid">
              {filteredHotels.map(hotel => (
                <div key={hotel.id || hotel._id} className="hotel-card card">
                  <div className="hotel-image-container">
                    {/* Handle potential image variations from API */}
                    <img 
                      src={hotel.image || hotel.photos?.[0] || "https://via.placeholder.com/400x300?text=No+Image"} 
                      alt={hotel.name} 
                    />
                    <span className="rating-badge">
                      <Star size={14} fill="currentColor" /> {hotel.rating || "New"}
                    </span>
                  </div>
                  
                  <div className="hotel-details">
                    <div className="hotel-location">
                      <MapPin size={14} /> {hotel.location}
                    </div>
                    <h3>{hotel.name}</h3>
                    
                    <div className="hotel-features">
                      {(hotel.features || []).slice(0, 3).map((f, i) => (
                        <span key={i} className="feature-tag">{f}</span>
                      ))}
                      {(hotel.features || []).length > 3 && <span className="feature-tag">+{hotel.features.length - 3}</span>}
                    </div>

                    <div className="hotel-footer">
                      <div className="hotel-price">
                        {/* Handle price variations */}
                        <span className="amount">${hotel.cheapestPrice || hotel.price || 0}</span>
                        <span className="unit">/ night</span>
                      </div>
                      <Link to={`/hotel/${hotel.id || hotel._id}`} className="btn-primary">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <h3>No hotels found</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button className="btn-primary" onClick={clearFilters}>Clear all filters</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HotelPage;