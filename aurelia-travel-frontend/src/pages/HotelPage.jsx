import { useState, useEffect } from 'react'
import axios from 'axios'
import HotelCard from '../components/ui/HotelCard'
import SearchForm from '../components/ui/SearchForm'
import { Filter, X, SlidersHorizontal, MapPin } from 'lucide-react'
import './styles/HotelPage.css' // We will use this new clean file

// Define available amenities for filtering
const AMENITIES_OPTIONS = [
  "WiFi", "Pool", "Parking", "Restaurant", "Air Conditioning", "Spa", "Gym", "Bar", "Beach Access"
]

const HotelPage = () => {
  // Data States
  const [hotels, setHotels] = useState([]) // Stores ALL hotels fetched
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter States
  const [selectedFilters, setSelectedFilters] = useState([])

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        // Fetch both endpoints
        const [topRes, newRes] = await Promise.all([
          axios.get('http://localhost:5000/api/hotels/top-rated'),
          axios.get('http://localhost:5000/api/hotels/newest')
        ])

        // Combine and Deduplicate hotels by ID
        const allFetched = [...(topRes.data.data || topRes.data), ...(newRes.data.data || newRes.data)];
        const uniqueHotels = Array.from(new Map(allFetched.map(item => [item.id || item._id, item])).values());
        
        setHotels(uniqueHotels)
      } catch (err) {
        console.error('Fetch Error:', err)
        setError('Could not load hotels. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchHotels()
  }, [])

  // --- 2. FILTER LOGIC ---
  const handleFilterChange = (amenity) => {
    setSelectedFilters(prev => 
      prev.includes(amenity) 
        ? prev.filter(item => item !== amenity) 
        : [...prev, amenity]
    )
  }

  // Filter the hotels based on selection
  const filteredHotels = hotels.filter(hotel => {
    if (selectedFilters.length === 0) return true; // Show all if no filter

    // Normalize hotel amenities to array of lowercase strings
    const hotelAmenities = Array.isArray(hotel.amenities) 
      ? hotel.amenities.map(a => a.toLowerCase().trim())
      : (hotel.amenities || '').toLowerCase().split(',').map(a => a.trim());

    // Check if hotel has ALL selected filters
    return selectedFilters.every(filter => hotelAmenities.includes(filter.toLowerCase()));
  });

  // --- 3. RENDER ---
  if (loading) return <div className="loading-container">Loading amazing stays...</div>

  return (
    <div className="page-wrapper">
      
      {/* SECTION 1: HEADER & SEARCH (No Slider) */}
      <div className="page-header-section">
        <div className="header-content">
          <h1>Find your next stay</h1>
          <p>Search low prices on hotels, homes and much more...</p>
          <div className="search-container-wrapper">
            <SearchForm />
          </div>
        </div>
      </div>

      {/* SECTION 2: MAIN CONTENT GRID (1:3 Ratio) */}
      <div className="main-content-container">
        
        {/* LEFT COLUMN: FILTERS (25%) */}
        <aside className="filter-sidebar">
          <div className="filter-card">
            <div className="filter-header">
              <h3><SlidersHorizontal size={18}/> Filters</h3>
              {selectedFilters.length > 0 && (
                <button onClick={() => setSelectedFilters([])} className="clear-btn">
                  Clear all
                </button>
              )}
            </div>
            
            <div className="filter-group">
              <h4>Popular Filters</h4>
              <div className="checkbox-list">
                {AMENITIES_OPTIONS.map(amenity => (
                  <label key={amenity} className="custom-checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedFilters.includes(amenity)}
                      onChange={() => handleFilterChange(amenity)}
                    />
                    <span className="checkmark"></span>
                    <span className="label-text">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Simulated Price Filter (Visual Only for now) */}
            <div className="filter-group">
                <h4>Price Range</h4>
                <div className="price-slider-mock">
                    <div className="price-track"></div>
                    <div className="price-range-text">$50 - $500+</div>
                </div>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: HOTELS (75%) */}
        <main className="hotel-results-area">
          <div className="results-header">
            <h2>
              {selectedFilters.length > 0 
                ? `Filtered Results (${filteredHotels.length})` 
                : `All Properties (${filteredHotels.length})`}
            </h2>
            <div className="sort-dropdown">
               Sort by: <strong>Recommended</strong>
            </div>
          </div>

          {filteredHotels.length === 0 ? (
            <div className="no-results-box">
              <div className="icon-box"><Filter size={40}/></div>
              <h3>No properties found</h3>
              <p>Try adjusting your filters to find a place to stay.</p>
              <button onClick={() => setSelectedFilters([])} className="btn-reset">Reset Filters</button>
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