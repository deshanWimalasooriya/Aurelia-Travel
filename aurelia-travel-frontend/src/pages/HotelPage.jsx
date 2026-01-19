import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import HotelCard from '../components/ui/HotelCard'
import SearchForm from '../components/ui/SearchForm'
import { Filter, MapPin, SlidersHorizontal, X } from 'lucide-react' 
import './styles/HotelPage.css'

const HotelPage = () => {
  const [searchParams] = useSearchParams();
  
  // --- DATA STATES (Untouched) ---
  const [hotels, setHotels] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // --- FILTER STATES (Untouched) ---
  const [selectedFilters, setSelectedFilters] = useState([])
  const [availableAmenities, setAvailableAmenities] = useState([]) 
  const [amenityCounts, setAmenityCounts] = useState({}) 
  
  // --- PRICE STATES (Untouched) ---
  const [priceRange, setPriceRange] = useState(1000) 
  const [maxPriceLimit, setMaxPriceLimit] = useState(1000)
  
  // Mobile Filter Toggle State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // --- 1. FETCH DATA (Fixed) ---
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        const [topRes, newRes] = await Promise.all([
          axios.get('http://localhost:5000/api/hotels/top-rated'),
          axios.get('http://localhost:5000/api/hotels/newest')
        ])

        const allFetched = [...(topRes.data.data || topRes.data), ...(newRes.data.data || newRes.data)];
        const uniqueHotels = Array.from(new Map(allFetched.map(item => [item.id || item._id, item])).values());
        
        setHotels(uniqueHotels)

        const allAmenities = new Set();
        const counts = {};
        let highestPrice = 0;

        uniqueHotels.forEach(h => {
             // Price Calculation
             const price = parseFloat(h.price || 0);
             if (price > highestPrice) highestPrice = price;

             // ✅ FIX: Safely handle Amenities (Object vs String)
             const list = Array.isArray(h.amenities) ? h.amenities : (h.amenities || '').split(',');
             
             list.forEach(rawA => {
                 // Check if it's an object (new backend) or string (old backend)
                 const name = (typeof rawA === 'object' && rawA !== null) ? rawA.name : String(rawA);
                 
                 // Safely trim
                 const a = name ? name.trim() : '';
                 
                 if(a) {
                     allAmenities.add(a);
                     counts[a] = (counts[a] || 0) + 1;
                 }
             });
        });

        setAvailableAmenities(Array.from(allAmenities).sort());
        setAmenityCounts(counts);
        
        const limit = Math.ceil(highestPrice + 100);
        setMaxPriceLimit(limit);
        setPriceRange(limit);

      } catch (err) {
        console.error('Fetch Error:', err)
        setError('Could not load hotels.')
      } finally {
        setLoading(false)
      }
    }
    fetchHotels()
  }, [])

  // --- 2. HANDLERS (Untouched) ---
  const handleFilterChange = (amenity) => {
    setSelectedFilters(prev => 
      prev.includes(amenity) ? prev.filter(i => i !== amenity) : [...prev, amenity]
    )
  }

  // --- 3. FILTERING LOGIC (Fixed) ---
  const filteredHotels = hotels.filter(hotel => {
    const locationParam = searchParams.get('location')?.toLowerCase() || '';
    const matchesLocation = !locationParam || (hotel.location || '').toLowerCase().includes(locationParam) || (hotel.name || '').toLowerCase().includes(locationParam);
    
    let matchesAmenities = true;
    if (selectedFilters.length > 0) {
        // ✅ FIX: Safely map amenities for filtering
        let hotelAmenities = [];
        
        if (Array.isArray(hotel.amenities)) {
            // Handle array of Objects OR Strings
            hotelAmenities = hotel.amenities.map(a => {
                const name = (typeof a === 'object' && a !== null) ? a.name : String(a);
                return name.toLowerCase().trim();
            });
        } else if (typeof hotel.amenities === 'string') {
            // Handle CSV String
            hotelAmenities = hotel.amenities.toLowerCase().split(',').map(a => a.trim());
        }

        matchesAmenities = selectedFilters.every(filter => hotelAmenities.includes(filter.toLowerCase()));
    }

    const matchesPrice = (parseFloat(hotel.price) || 0) <= priceRange;
    return matchesLocation && matchesAmenities && matchesPrice;
  });

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
          
          {/* Floating Search Glass */}
          <div className="floating-search-bar">
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
                   <h4>Price Range</h4>
                   <span className="price-tag">Up to LKR {priceRange.toLocaleString()}</span>
               </div>
               
               <div className="histogram-wrapper">
                    <div className="histogram-bars">
                        {/* Visual only - kept your logic */}
                        {[20, 40, 30, 60, 90, 50, 70, 40, 60, 30, 80, 40, 20].map((h, i) => (
                            <div key={i} className="hist-bar" style={{height: `${h}%`, opacity: i/13 + 0.3}}></div>
                        ))}
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max={maxPriceLimit} 
                        value={priceRange} 
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="modern-range"
                    />
               </div>
            </div>
            
            {/* 2. Amenities Section */}
            <div className="filter-card">
              <div className="card-header">
                  <h4>Amenities</h4>
                  {(selectedFilters.length > 0 || priceRange < maxPriceLimit) && (
                    <button onClick={() => {setSelectedFilters([]); setPriceRange(maxPriceLimit);}} className="reset-link">
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
                <strong>{filteredHotels.length}</strong> 
                <span>properties available in this area</span>
            </div>
            {/* Sort Dropdown could be here */}
          </div>

          {filteredHotels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><MapPin size={40} /></div>
              <h3>No matches found</h3>
              <p>We couldn't find any properties matching your specific filters. Try adjusting your price range or amenities.</p>
              <button onClick={() => { setSelectedFilters([]); setPriceRange(maxPriceLimit); }} className="btn-primary-outline">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="hotel-grid-modern">
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