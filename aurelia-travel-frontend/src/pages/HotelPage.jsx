import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import HotelCard from '../components/ui/HotelCard'
import SkeletonCard from '../components/ui/SkeletonCard' // ✅ Import Skeleton
import SearchForm from '../components/ui/SearchForm'
import { Filter, SlidersHorizontal, X } from 'lucide-react'
import './styles/HotelPage.css'

const HotelPage = () => {
  // ... (Keep existing states) ...
  const [searchParams] = useSearchParams();
  const [allHotels, setAllHotels] = useState([])
  const [topHotels, setTopHotels] = useState([]) 
  const [newHotels, setNewHotels] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [selectedFilters, setSelectedFilters] = useState([]) 
  const [availableAmenities, setAvailableAmenities] = useState([])
  const [amenityCounts, setAmenityCounts] = useState({})
  
  const [priceRange, setPriceRange] = useState([0, 50000]) 
  const [maxPriceLimit, setMaxPriceLimit] = useState(50000)
  const [minRating, setMinRating] = useState(0)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // ... (Keep fetch logic) ...
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

        const highestPrice = Math.max(...allData.map(h => parseFloat(h.base_price_per_night || h.price || 0)));
        if(highestPrice > 0) {
            setMaxPriceLimit(highestPrice);
            setPriceRange([0, highestPrice]); 
        }

        const counts = {};
        const uniqueAmenities = new Set();
        allData.forEach(hotel => {
            const list = Array.isArray(hotel.amenities) ? hotel.amenities : [];
            list.forEach(a => {
                const name = typeof a === 'string' ? a : a.name;
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

  const handleFilterChange = (amenity) => {
    setSelectedFilters(prev =>
      prev.includes(amenity) ? prev.filter(i => i !== amenity) : [...prev, amenity]
    )
  }

  // ... (Keep filtering logic) ...
  const filteredHotels = useMemo(() => {
    if (!allHotels) return [];
    const locationQuery = (searchParams.get('location') || '').toLowerCase().trim();
    const searchQuery = (searchParams.get('q') || '').toLowerCase().trim();

    return allHotels.filter(hotel => {
      const name = (hotel.name || '').toLowerCase();
      const city = (hotel.city || '').toLowerCase();
      const matchesLocation = !locationQuery || city.includes(locationQuery) || (hotel.state || '').toLowerCase().includes(locationQuery);
      const matchesSearch = !searchQuery || name.includes(searchQuery) || city.includes(searchQuery);
      const price = parseFloat(hotel.base_price_per_night || hotel.price || 0);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const rating = parseFloat(hotel.rating_average || hotel.rating || 0);
      const matchesRating = rating >= minRating;
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

  // ✅ NEW: Replace full-page loading with skeleton layout
  // (We remove the "if (loading) return ..." block from here)

  return (
    <div className="page-wrapper">
      
      {/* HEADER (Always visible) */}
      <div className="modern-header">
        <div className="header-bg-overlay"></div>
        <div className="header-content-centered">
          <h1>Find your sanctuary</h1>
          <p>Discover luxury, comfort, and adventure.</p>
          <div className="floating-search-bar">
            <SearchForm /> 
          </div>
        </div>
      </div>

      <div className="main-layout-grid">
        
        {/* MOBILE FILTER TOGGLE */}
        <button className="mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
            <SlidersHorizontal size={18} /> Filters
        </button>

        {/* LEFT SIDEBAR (Hide if loading to keep layout clean, or show skeletons inside sidebar too?) 
            For now, we'll keep the sidebar visible but static/empty if loading. 
        */}
        <aside className={`filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header-mobile">
            <h3>Filters</h3>
            <button onClick={() => setIsMobileFilterOpen(false)}><X size={20}/></button>
          </div>

          {/* Only show filters when data is ready, otherwise show a simplified loading state for sidebar */}
          {!loading ? (
            <div className="sidebar-sticky-content">
                <div className="filter-card">
                   <div className="card-header">
                       <h4>Max Price</h4>
                       <span className="price-tag">LKR {priceRange[1].toLocaleString()}</span>
                   </div>
                   <div className="histogram-wrapper">
                       <input type="range" min="0" max={maxPriceLimit} value={priceRange[1]} onChange={(e) => setPriceRange([0, Number(e.target.value)])} className="modern-range" />
                   </div>
                </div>
                <div className="filter-card">
                  <div className="card-header">
                      <h4>Amenities</h4>
                      {(selectedFilters.length > 0 || priceRange[1] < maxPriceLimit) && (
                        <button onClick={() => { setSelectedFilters([]); setPriceRange([0, maxPriceLimit]); }} className="reset-link">Reset</button>
                      )}
                  </div>
                  <div className="amenities-scroll-area">
                    {availableAmenities.map(amenity => (
                      <label key={amenity} className="amenity-row">
                          <input type="checkbox" checked={selectedFilters.includes(amenity)} onChange={() => handleFilterChange(amenity)} />
                          <span className="custom-check"></span>
                          <span className="amenity-name">{amenity}</span>
                          <span className="amenity-count">({amenityCounts[amenity] || 0})</span>
                      </label>
                    ))}
                  </div>
                </div>
            </div>
          ) : (
            <div className="sidebar-sticky-content">
                <div className="filter-card"><div className="skeleton-text title skeleton-pulse"></div></div>
                <div className="filter-card"><div className="skeleton-text title skeleton-pulse"></div></div>
            </div>
          )}
        </aside>

        {/* RIGHT CONTENT */}
        <main className="results-feed">
          <div className="results-toolbar">
            <div className="result-count">
                <strong>{loading ? '...' : filteredHotels.length}</strong> 
                <span> properties match your search</span>
            </div>
          </div>

          {/* ✅ UPDATED: Skeleton Logic */}
          {loading ? (
            <div className="hotel-grid-modern">
                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Filter size={40} /></div>
              <h3>No matches found</h3>
              <p>We couldn't find any properties matching your specific filters.</p>
              <button onClick={() => { setSelectedFilters([]); setPriceRange([0, maxPriceLimit]); }} className="btn-primary-outline">Clear Filters</button>
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