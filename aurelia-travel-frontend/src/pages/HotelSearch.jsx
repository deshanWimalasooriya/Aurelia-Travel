import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import HotelCard from '../components/ui/HotelCard'
import SearchForm from '../components/ui/SearchForm'
import { MapPin, SlidersHorizontal, X } from 'lucide-react'
import './styles/HotelPage.css'

const HotelSearch = () => {
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]) 
  const [loading, setLoading] = useState(true)
  
  // Filter States
  const [selectedFilters, setSelectedFilters] = useState([])
  const [availableAmenities, setAvailableAmenities] = useState([]) 
  const [amenityCounts, setAmenityCounts] = useState({}) 
  const [priceRange, setPriceRange] = useState(1000) 
  const [maxPriceLimit, setMaxPriceLimit] = useState(1000)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // 1. FETCH & COMBINE DATA (Same logic as before to get full list)
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        const [topRes, newRes] = await Promise.all([
          axios.get('http://localhost:5000/api/hotels/top-rated'),
          axios.get('http://localhost:5000/api/hotels/newest')
        ])

        const allFetched = [...(topRes.data.data || topRes.data), ...(newRes.data.data || newRes.data)];
        // Remove duplicates
        const uniqueHotels = Array.from(new Map(allFetched.map(item => [item.id || item._id, item])).values());
        
        setHotels(uniqueHotels)

        // Calculate Filters
        const allAmenities = new Set();
        const counts = {};
        let highestPrice = 0;

        uniqueHotels.forEach(h => {
             if (h.price > highestPrice) highestPrice = h.price;
             const list = Array.isArray(h.amenities) ? h.amenities : (h.amenities || '').split(',');
             list.forEach(rawA => {
                 const a = rawA.trim();
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
        console.error('Error', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHotels()
  }, [])

  // 2. HANDLERS
  const handleFilterChange = (amenity) => {
    setSelectedFilters(prev => 
      prev.includes(amenity) ? prev.filter(i => i !== amenity) : [...prev, amenity]
    )
  }

  // 3. FILTERING LOGIC
  const filteredHotels = hotels.filter(hotel => {
    const locationParam = searchParams.get('location')?.toLowerCase() || '';
    const matchesLocation = !locationParam || hotel.location.toLowerCase().includes(locationParam) || hotel.name.toLowerCase().includes(locationParam);
    
    let matchesAmenities = true;
    if (selectedFilters.length > 0) {
        const hotelAmenities = Array.isArray(hotel.amenities) 
            ? hotel.amenities.map(a => a.toLowerCase().trim())
            : (hotel.amenities || '').toLowerCase().split(',').map(a => a.trim());
        matchesAmenities = selectedFilters.every(filter => hotelAmenities.includes(filter.toLowerCase()));
    }

    const matchesPrice = (hotel.price || 0) <= priceRange;
    return matchesLocation && matchesAmenities && matchesPrice;
  });

  if (loading) return <div className="loading-container"><div className="loader-spinner"></div></div>

  return (
    <div className="page-wrapper">
      
      {/* COMPACT HEADER FOR SEARCH PAGE */}
      <div className="modern-header compact">
        <div className="header-bg-overlay"></div>
        <div className="header-content-centered">
          <div className="floating-search-bar compact-bar">
            <SearchForm /> 
          </div>
        </div>
      </div>

      <div className="main-layout-grid">
        
        {/* MOBILE TOGGLE */}
        <button className="mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
            <SlidersHorizontal size={18} /> Filters
        </button>

        {/* --- SIDEBAR (FILTERS) --- */}
        <aside className={`filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header-mobile">
            <h3>Filters</h3>
            <button onClick={() => setIsMobileFilterOpen(false)}><X size={20}/></button>
          </div>

          <div className="sidebar-sticky-content">
            {/* Price Filter */}
            <div className="filter-card">
               <div className="card-header">
                   <h4>Price Range</h4>
                   <span className="price-tag">Up to LKR {priceRange}</span>
               </div>
               <div className="histogram-wrapper">
                    <input 
                        type="range" min="0" max={maxPriceLimit} value={priceRange} 
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="modern-range"
                    />
               </div>
            </div>
            
            {/* Amenities Filter */}
            <div className="filter-card">
              <div className="card-header">
                  <h4>Amenities</h4>
                  {(selectedFilters.length > 0) && (
                    <button onClick={() => setSelectedFilters([])} className="reset-link">Reset</button>
                  )}
              </div>
              <div className="amenities-scroll-area">
                {availableAmenities.map(amenity => (
                  <label key={amenity} className="amenity-row">
                      <input type="checkbox" checked={selectedFilters.includes(amenity)} onChange={() => handleFilterChange(amenity)}/>
                      <span className="custom-check"></span>
                      <span className="amenity-name">{amenity}</span>
                      <span className="amenity-count">({amenityCounts[amenity] || 0})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* --- RESULTS GRID --- */}
        <main className="results-feed">
          <div className="results-toolbar">
            <div className="result-count">
                <strong>{filteredHotels.length}</strong> properties found
            </div>
          </div>

          {filteredHotels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><MapPin size={40} /></div>
              <h3>No matches found</h3>
              <p>Try adjusting your filters.</p>
              <button onClick={() => { setSelectedFilters([]); setPriceRange(maxPriceLimit); }} className="btn-primary-outline">Clear Filters</button>
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

export default HotelSearch