import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import HotelCard from '../components/ui/HotelCard'
import SkeletonCard from '../components/ui/SkeletonCard'
import { SlidersHorizontal, X, MapPin } from 'lucide-react'
import './styles/hotelPage.css' // ✅ Use the modern premium stylesheet

const SearchResults = () => {
  // ... (Keep existing state and filter logic) ...
  const location = useLocation()
  const [hotels, setHotels] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const hotelsPerPage = 8
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const [filters, setFilters] = useState({
    priceRange: [0, 100000], 
    rating: 0,
    facilities: [],
    searchQuery: '', 
    district: '',    
    province: ''     
  })

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        const res = await api.get('/hotels');
        const realData = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setHotels(realData);
      } catch (err) {
        console.error("Failed to fetch hotels:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHotels();
  }, [])
  
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const initialLocation = params.get('location') || ''
    if (initialLocation) {
        setFilters(prev => ({ ...prev, searchQuery: initialLocation }))
    }
  }, [location.search])

  const filteredHotels = hotels.filter(hotel => {
    const query = filters.searchQuery.toLowerCase().trim();
    const districtFilter = filters.district.toLowerCase().trim();
    const provinceFilter = filters.province.toLowerCase().trim();
    const matchesSearch = query === '' || 
        (hotel.name || '').toLowerCase().includes(query) ||
        (hotel.address_line_1 || '').toLowerCase().includes(query) ||
        (hotel.city || '').toLowerCase().includes(query) ||
        (hotel.state || '').toLowerCase().includes(query) ||
        (hotel.country || '').toLowerCase().includes(query);
    const matchesDistrict = districtFilter === '' || 
        (hotel.city || '').toLowerCase().includes(districtFilter) ||
        (hotel.address_line_1 || '').toLowerCase().includes(districtFilter);
    const matchesProvince = provinceFilter === '' || 
        (hotel.state || '').toLowerCase().includes(provinceFilter) ||
        (hotel.country || '').toLowerCase().includes(provinceFilter);
    const hotelPrice = parseFloat(hotel.base_price_per_night || hotel.price || 0);
    const matchesPrice = hotelPrice >= filters.priceRange[0] && hotelPrice <= filters.priceRange[1];
    const hotelRating = parseFloat(hotel.rating_average || hotel.rating || 0);
    const matchesRating = hotelRating >= filters.rating;
    const matchesFacilities = filters.facilities.length === 0 || 
        filters.facilities.every(f => {
            const list = Array.isArray(hotel.amenities) ? hotel.amenities : [];
            return list.some(a => {
                const name = typeof a === 'string' ? a : a.name;
                return name.toLowerCase() === f.toLowerCase();
            });
        });
    return matchesSearch && matchesDistrict && matchesProvince && matchesPrice && matchesRating && matchesFacilities;
  })

  const totalPages = Math.ceil(filteredHotels.length / hotelsPerPage)
  const startIndex = (currentPage - 1) * hotelsPerPage
  const paginatedHotels = filteredHotels.slice(startIndex, startIndex + hotelsPerPage)

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? 
        checked ? [...prev.facilities, value] : prev.facilities.filter(f => f !== value) :
        value
    }))
    setCurrentPage(1) 
  }

  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      priceRange: name === 'min' ? [value, prev.priceRange[1]] : [prev.priceRange[0], value]
    }))
    setCurrentPage(1)
  }

  const renderSkeletons = () => (
    <div className="hotel-grid-modern">
        {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div className="page-wrapper" style={{paddingTop: '60px'}}>
      <div className="main-layout-grid" style={{marginTop: '0'}}>
        
        {/* MOBILE TOGGLE */}
        <button className="mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
            <SlidersHorizontal size={18} /> Filters
        </button>

        {/* SIDEBAR FILTERS */}
        <aside className={`filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header-mobile">
            <h3>Filters</h3>
            <button onClick={() => setIsMobileFilterOpen(false)}><X size={24}/></button>
          </div>

          <div className="sidebar-sticky-content">
            {/* Search Filters */}
            <div className="filter-card">
              <div className="card-header"><h4>Location & Name</h4></div>
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                  <input type="text" name="searchQuery" value={filters.searchQuery} onChange={handleFilterChange} className="form-input" placeholder="Global Search..." />
                  <input type="text" name="district" value={filters.district} onChange={handleFilterChange} className="form-input" placeholder="City / District" />
                  <input type="text" name="province" value={filters.province} onChange={handleFilterChange} className="form-input" placeholder="State / Province" />
              </div>
            </div>

            {/* Price Filter */}
            <div className="filter-card">
              <div className="card-header"><h4>Price Range</h4></div>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <input type="number" name="min" value={filters.priceRange[0]} onChange={handlePriceRangeChange} className="form-input" placeholder="Min" />
                <span style={{color:'var(--text-muted)'}}>-</span>
                <input type="number" name="max" value={filters.priceRange[1]} onChange={handlePriceRangeChange} className="form-input" placeholder="Max" />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="filter-card">
              <div className="card-header"><h4>Star Rating</h4></div>
              <select name="rating" value={filters.rating} onChange={handleFilterChange} className="form-input">
                <option value="0">Any</option><option value="4">4+ Stars</option><option value="4.5">4.5+ Stars</option><option value="4.8">4.8+ Stars</option>
              </select>
            </div>

            {/* Facilities Filter */}
            <div className="filter-card">
              <div className="card-header"><h4>Facilities</h4></div>
              <div className="amenities-scroll-area">
                {['WiFi', 'Pool', 'Parking', 'AC', 'Restaurant'].map(facility => (
                  <label key={facility} className="amenity-row">
                    <input type="checkbox" name="facilities" value={facility} checked={filters.facilities.includes(facility)} onChange={handleFilterChange} />
                    <span className="custom-check"></span>
                    <span className="amenity-name">{facility}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* RESULTS AREA */}
        <main className="results-feed">
          <div className="results-toolbar">
            <div className="result-count">
              <strong>{loading ? 'Searching...' : `${filteredHotels.length}`}</strong> properties found
            </div>
          </div>

          {loading ? renderSkeletons() : (
              filteredHotels.length > 0 ? (
                  <div className="hotel-grid-modern">
                  {paginatedHotels.map(hotel => (
                      <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                  </div>
              ) : (
                  <div className="empty-state">
                      <div className="empty-icon"><MapPin size={36}/></div>
                      <h3>No matches found</h3>
                      <p>Try adjusting your search criteria or price range.</p>
                      <button onClick={() => setFilters({priceRange: [0, 100000], rating: 0, facilities: [], searchQuery: '', district: '', province: ''})} className="btn-primary-outline">Clear Filters</button>
                  </div>
              )
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{display:'flex', justifyContent:'center', gap:'8px', marginTop:'40px'}}>
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)} 
                  style={{
                      padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-subtle)',
                      background: currentPage === i + 1 ? 'var(--color-primary)' : 'white',
                      color: currentPage === i + 1 ? 'white' : 'var(--color-dark)',
                      transition: 'all 0.2s'
                  }}
                >
                    {i + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default SearchResults