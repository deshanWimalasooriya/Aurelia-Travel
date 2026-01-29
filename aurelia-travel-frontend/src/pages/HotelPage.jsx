import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api' // Ensure this path is correct
// import axios from 'axios' // not used since you are using 'api' instance
import HotelCard from '../components/ui/HotelCard'
import SearchForm from '../components/ui/SearchForm'
import { Filter, SlidersHorizontal, X } from 'lucide-react'
import './styles/HotelPage.css'

const HotelPage = () => {
  const [searchParams] = useSearchParams();

  // --- 1. DATA STATES ---
  const [allHotels, setAllHotels] = useState([])
  const [topHotels, setTopHotels] = useState([]) // FIX: Was missing
  const [newHotels, setNewHotels] = useState([]) // FIX: Was missing
  const [loading, setLoading] = useState(true)
  
  // --- 2. FILTER STATES ---
  const [selectedFilters, setSelectedFilters] = useState([]) // This represents amenities
  const [availableAmenities, setAvailableAmenities] = useState([])
  const [amenityCounts, setAmenityCounts] = useState({})
  
  // --- 3. PRICE & RATING STATES ---
  // We initialize price to a high number or 0, then update it after data loads
  const [priceRange, setPriceRange] = useState([0, 50000]) // FIX: Changed to array [min, max] for better control
  const [maxPriceLimit, setMaxPriceLimit] = useState(50000)
  const [minRating, setMinRating] = useState(0) // FIX: Added state for rating

  // Mobile Filter Toggle State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // --- 4. FETCH DATA & INITIALIZE FILTERS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allRes, topRes, newRes] = await Promise.all([
          api.get('/hotels'),
          api.get('/hotels/top-rated'),
          api.get('/hotels/newest')
        ]);

        const allData = Array.isArray(allRes.data) ? allRes.data : (allRes.data.data || []);
        const topData = Array.isArray(topRes.data) ? topRes.data : (topRes.data.data || []);
        const newData = Array.isArray(newRes.data) ? newRes.data : (newRes.data.data || []);

        setAllHotels(allData);
        setTopHotels(topData.slice(0, 5));
        setNewHotels(newData.slice(0, 5));

        // --- TEACHER'S FIX: Dynamic Data Calculation ---
        // 1. Calculate the highest price in the DB to set the slider max
        const highestPrice = Math.max(...allData.map(h => parseFloat(h.base_price_per_night || h.price || 0)));
        if(highestPrice > 0) {
            setMaxPriceLimit(highestPrice);
            setPriceRange([0, highestPrice]); 
        }

        // 2. Extract all unique amenities and count them
        const counts = {};
        const uniqueAmenities = new Set();
        
        allData.forEach(hotel => {
            const list = Array.isArray(hotel.amenities) ? hotel.amenities : [];
            list.forEach(a => {
                const name = typeof a === 'string' ? a : a.name; // Handle object vs string
                if (name) {
                    uniqueAmenities.add(name);
                    counts[name] = (counts[name] || 0) + 1;
                }
            });
        });

        setAvailableAmenities(Array.from(uniqueAmenities).sort());
        setAmenityCounts(counts);

      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 5. HANDLERS ---
  const handleFilterChange = (amenity) => {
    setSelectedFilters(prev =>
      prev.includes(amenity) ? prev.filter(i => i !== amenity) : [...prev, amenity]
    )
  }

  // --- 6. FILTER LOGIC (The Core Fix) ---
  const filteredHotels = useMemo(() => {
    if (!allHotels) return [];

    // FIX: specific search query from URL or SearchBar
    const locationQuery = (searchParams.get('location') || '').toLowerCase().trim();
    const searchQuery = (searchParams.get('q') || '').toLowerCase().trim();

    return allHotels.filter(hotel => {
      // A. SEARCH MATCH
      const name = (hotel.name || '').toLowerCase();
      const city = (hotel.city || '').toLowerCase();
      const matchesLocation = !locationQuery || city.includes(locationQuery) || (hotel.state || '').toLowerCase().includes(locationQuery);
      const matchesSearch = !searchQuery || name.includes(searchQuery) || city.includes(searchQuery);

      // B. PRICE CHECK
      const price = parseFloat(hotel.base_price_per_night || hotel.price || 0);
      // Check if price is between min (index 0) and max (index 1)
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      // C. RATING CHECK
      const rating = parseFloat(hotel.rating_average || hotel.rating || 0);
      const matchesRating = rating >= minRating;

      // D. AMENITIES CHECK
      const matchesAmenities = selectedFilters.length === 0 ||
        selectedFilters.every(filter => {
            const list = Array.isArray(hotel.amenities) ? hotel.amenities : [];
            return list.some(a => {
               const name = typeof a === 'string' ? a : a.name;
               return name && name.toLowerCase() === filter.toLowerCase();
            });
        });

      return matchesLocation && matchesSearch && matchesPrice && matchesRating && matchesAmenities;
    });
  }, [allHotels, searchParams, priceRange, minRating, selectedFilters]);


  if (loading) return (
    <div className="loading-container">
        <div className="loader-spinner"></div>
        <p>Curating the best stays for you...</p>
    </div>
  )

  return (
    <div className="page-wrapper">
      
      {/* --- HERO HEADER --- */}
      <div className="modern-header">
        <div className="header-bg-overlay"></div>
        <div className="header-content-centered">
          <h1>Find your sanctuary</h1>
          <p>Discover luxury, comfort, and adventure.</p>
          <div className="floating-search-bar">
            {/* Pass current params to prepopulate form if needed */}
            <SearchForm /> 
          </div>
        </div>
      </div>

      <div className="main-layout-grid">
        
        {/* --- MOBILE FILTER TOGGLE --- */}
        <button className="mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
            <SlidersHorizontal size={18} /> Filters
        </button>

        {/* --- LEFT SIDEBAR --- */}
        <aside className={`filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          
          <div className="sidebar-header-mobile">
            <h3>Filters</h3>
            <button onClick={() => setIsMobileFilterOpen(false)}><X size={20}/></button>
          </div>

          <div className="sidebar-sticky-content">
            
            {/* 1. Price Section */}
            <div className="filter-card">
               <div className="card-header">
                   <h4>Max Price</h4>
                   <span className="price-tag">LKR {priceRange[1].toLocaleString()}</span>
               </div>
               
               <div className="histogram-wrapper">
                   {/* Simplified Histogram for visual */}
                   <div className="histogram-bars">
                       {[20, 40, 30, 60, 90, 50, 70, 40, 60, 30, 80, 40, 20].map((h, i) => (
                           <div key={i} className="hist-bar" style={{height: `${h}%`, opacity: i/13 + 0.3}}></div>
                       ))}
                   </div>
                   <input 
                       type="range" 
                       min="0" 
                       max={maxPriceLimit} 
                       value={priceRange[1]} 
                       onChange={(e) => setPriceRange([0, Number(e.target.value)])} // Update Max only
                       className="modern-range"
                   />
               </div>
            </div>
            
            {/* 2. Amenities Section */}
            <div className="filter-card">
              <div className="card-header">
                  <h4>Amenities</h4>
                  {(selectedFilters.length > 0 || priceRange[1] < maxPriceLimit) && (
                    <button 
                        onClick={() => {
                            setSelectedFilters([]); 
                            setPriceRange([0, maxPriceLimit]);
                        }} 
                        className="reset-link"
                    >
                        Reset
                    </button>
                  )}
              </div>
              
              <div className="amenities-scroll-area">
                {availableAmenities.map(amenity => (
                  <label key={amenity} className="amenity-row">
                      <input 
                        type="checkbox" 
                        checked={selectedFilters.includes(amenity)}
                        onChange={() => handleFilterChange(amenity)}
                      />
                      <span className="custom-check"></span>
                      <span className="amenity-name">{amenity}</span>
                      <span className="amenity-count">({amenityCounts[amenity] || 0})</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* --- RIGHT CONTENT --- */}
        <main className="results-feed">
          <div className="results-toolbar">
            <div className="result-count">
                {/* FIX: Use filteredHotels.length, not allHotels.length */}
                <strong>{filteredHotels.length}</strong> 
                <span> properties match your search</span>
            </div>
          </div>

          {filteredHotels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Filter size={40} /></div>
              <h3>No matches found</h3>
              <p>We couldn't find any properties matching your specific filters.</p>
              <button onClick={() => { setSelectedFilters([]); setPriceRange([0, maxPriceLimit]); }} className="btn-primary-outline">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="hotel-grid-modern">
              {/* FIX: Map over filteredHotels, not allHotels */}
              {filteredHotels.map(hotel => (
                <div className="hotel-card-wrapper" key={hotel.id || hotel._id}>
                    <HotelCard hotel={hotel} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default HotelPage