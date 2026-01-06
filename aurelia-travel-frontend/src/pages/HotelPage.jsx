import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import HotelCard from '../components/ui/HotelCard'
import SearchForm from '../components/ui/SearchForm'
import { Filter, Search } from 'lucide-react' // Clean icons
import './styles/HotelPage.css'

const HotelPage = () => {
  const [searchParams] = useSearchParams();
  
  // Data States
  const [hotels, setHotels] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter States
  const [selectedFilters, setSelectedFilters] = useState([])
  const [availableAmenities, setAvailableAmenities] = useState([]) 
  const [amenityCounts, setAmenityCounts] = useState({}) // Stores count: { "Pool": 5, "WiFi": 10 }
  
  // Price States
  const [priceRange, setPriceRange] = useState(1000) 
  const [maxPriceLimit, setMaxPriceLimit] = useState(1000)

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        const [topRes, newRes] = await Promise.all([
          axios.get('http://localhost:5000/api/hotels/top-rated'),
          axios.get('http://localhost:5000/api/hotels/newest')
        ])

        // Combine & Deduplicate
        const allFetched = [...(topRes.data.data || topRes.data), ...(newRes.data.data || newRes.data)];
        const uniqueHotels = Array.from(new Map(allFetched.map(item => [item.id || item._id, item])).values());
        
        setHotels(uniqueHotels)

        // --- DYNAMIC DATA EXTRACTION ---
        const allAmenities = new Set();
        const counts = {};
        let highestPrice = 0;

        uniqueHotels.forEach(h => {
             // 1. Process Price
             if (h.price > highestPrice) highestPrice = h.price;

             // 2. Process Amenities
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
        
        // Add buffer to max price
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

  // --- 2. HANDLERS ---
  const handleFilterChange = (amenity) => {
    setSelectedFilters(prev => 
      prev.includes(amenity) ? prev.filter(i => i !== amenity) : [...prev, amenity]
    )
  }

  // --- 3. FILTERING LOGIC ---
  const filteredHotels = hotels.filter(hotel => {
    // A. Search Bar Params
    const locationParam = searchParams.get('location')?.toLowerCase() || '';
    const matchesLocation = !locationParam || hotel.location.toLowerCase().includes(locationParam) || hotel.name.toLowerCase().includes(locationParam);
    
    // B. Sidebar: Amenities
    let matchesAmenities = true;
    if (selectedFilters.length > 0) {
        const hotelAmenities = Array.isArray(hotel.amenities) 
            ? hotel.amenities.map(a => a.toLowerCase().trim())
            : (hotel.amenities || '').toLowerCase().split(',').map(a => a.trim());
        matchesAmenities = selectedFilters.every(filter => hotelAmenities.includes(filter.toLowerCase()));
    }

    // C. Sidebar: Price
    const matchesPrice = (hotel.price || 0) <= priceRange;

    return matchesLocation && matchesAmenities && matchesPrice;
  });

  if (loading) return <div className="loading-container">Loading hotels...</div>

  return (
    <div className="page-wrapper">
      
      {/* HEADER */}
      <div className="page-header-section">
        <div className="header-content">
          <h1>Find your next stay</h1>
          <div className="search-container-wrapper">
            <SearchForm /> 
          </div>
        </div>
      </div>

      <div className="main-content-container">
        
        {/* --- LEFT SIDEBAR (BOOKING.COM STYLE) --- */}
        <aside className="filter-sidebar">
          
          {/* Header */}
          <div className="sidebar-title-section">
             <h3>Filter by:</h3>
          </div>

          <div className="filter-card">
            
            {/* 1. Budget Section with Histogram */}
            <div className="filter-group">
                <h4>Your budget (per night)</h4>
                
                {/* Visual Histogram Bars */}
                <div className="price-histogram">
                    {[30, 50, 40, 70, 90, 60, 40, 80, 50, 30, 60, 40, 20].map((h, i) => (
                        <div key={i} className="hist-bar" style={{height: `${h}%`}}></div>
                    ))}
                </div>

                <div className="price-slider-container">
                    <div className="price-display">LKR 0 – LKR {priceRange}+</div>
                    <input 
                        type="range" 
                        min="0" 
                        max={maxPriceLimit} 
                        value={priceRange} 
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="range-slider"
                    />
                </div>
            </div>
            
            {/* 2. Amenities Section (Popular Filters) */}
            <div className="filter-group">
              <h4>Popular filters</h4>
              <div className="checkbox-list">
                {availableAmenities.map(amenity => (
                  <div key={amenity} className="filter-row">
                      <label className="custom-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedFilters.includes(amenity)}
                          onChange={() => handleFilterChange(amenity)}
                        />
                        <span className="checkmark"></span>
                        <span className="label-text">{amenity}</span>
                      </label>
                      <span className="count-badge">{amenityCounts[amenity] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Button */}
            {(selectedFilters.length > 0 || priceRange < maxPriceLimit) && (
                <div className="filter-footer">
                    <button onClick={() => {setSelectedFilters([]); setPriceRange(maxPriceLimit);}} className="clear-btn-full">
                        Clear all filters
                    </button>
                </div>
            )}

          </div>
        </aside>

        {/* --- RIGHT CONTENT --- */}
        <main className="hotel-results-area">
          <div className="results-header">
            <h2>{filteredHotels.length} properties found</h2>
            <div className="sort-dropdown">
               Sort by: <strong>Top Picks</strong>
            </div>
          </div>

          {filteredHotels.length === 0 ? (
            <div className="no-results-box">
              <Filter size={40} className="text-gray-400 mb-4"/>
              <h3>No properties found</h3>
              <p>Try changing your filters or search area.</p>
              <button onClick={() => { setSelectedFilters([]); setPriceRange(maxPriceLimit); }} className="btn-reset">
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="hotel-cards-grid">
              {filteredHotels.map(hotel => (
                <HotelCard key={hotel.id || hotel._id} hotel={hotel} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default HotelPage