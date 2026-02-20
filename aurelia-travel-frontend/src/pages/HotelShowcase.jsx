import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api' 
import HotelCard from '../components/ui/HotelCard'
import SkeletonCard from '../components/ui/SkeletonCard' 
import SearchForm from '../components/ui/SearchForm'
import { Star, Zap, SlidersHorizontal, X, MapPin } from 'lucide-react'
import './styles/hotelPage.css'

const HotelShowcase = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [allHotels, setAllHotels] = useState([]) 
  const [topHotels, setTopHotels] = useState([])
  const [newHotels, setNewHotels] = useState([])
  const [loading, setLoading] = useState(true)

  const [priceRange, setPriceRange] = useState([0, 100000])
  const [selectedRating, setSelectedRating] = useState(0)
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [allRes, topRes, newRes] = await Promise.all([
          api.get('/hotels'),
          api.get('/hotels/top-rated'),
          api.get('/hotels/newest')
        ])

        const allData = Array.isArray(allRes.data) ? allRes.data : (allRes.data.data || []);
        const topData = Array.isArray(topRes.data) ? topRes.data : (topRes.data.data || []);
        const newData = Array.isArray(newRes.data) ? newRes.data : (newRes.data.data || []);

        setAllHotels(allData)
        setTopHotels(topData.slice(0, 5))
        setNewHotels(newData.slice(0, 5))
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const locationQuery = searchParams.get('location') || '';
  const isSearching = locationQuery !== '' || selectedAmenities.length > 0 || selectedRating > 0;

  const filteredHotels = useMemo(() => {
      if (!isSearching) return [];
      const query = locationQuery.toLowerCase().trim();
      return allHotels.filter(hotel => {
        const matchesSearch = !query || 
            (hotel.name || '').toLowerCase().includes(query) ||
            (hotel.city || '').toLowerCase().includes(query) ||
            (hotel.state || '').toLowerCase().includes(query) || 
            (hotel.address_line_1 || '').toLowerCase().includes(query) ||
            (hotel.country || '').toLowerCase().includes(query);
        const price = parseFloat(hotel.base_price_per_night || hotel.price || 0);
        const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
        const rating = parseFloat(hotel.rating_average || hotel.rating || 0);
        const matchesRating = rating >= selectedRating;
        const matchesAmenities = selectedAmenities.length === 0 || 
            selectedAmenities.every(filter => {
            const list = Array.isArray(hotel.amenities) ? hotel.amenities : [];
            return list.some(a => {
                const name = typeof a === 'string' ? a : a.name;
                return name.toLowerCase() === filter.toLowerCase();
            });
            });
        return matchesSearch && matchesPrice && matchesRating && matchesAmenities;
      });
  }, [allHotels, locationQuery, priceRange, selectedRating, selectedAmenities, isSearching]);

  const handleClearFilters = () => {
    setSearchParams({});
    setSelectedAmenities([]);
    setSelectedRating(0);
    setPriceRange([0, 100000]);
  };

  const amenitiesList = ['WiFi', 'Pool', 'Parking', 'AC', 'Restaurant', 'Gym', 'Spa'];

  const renderSkeletons = (count = 4) => (
    <div className="hotel-grid-modern">
        {Array(count).fill(0).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="modern-header compact">
        <div className="header-bg-overlay"></div>
        <div className="header-content-centered">
          <h1>Find your sanctuary</h1>
          <p>Discover luxury, comfort, and adventure.</p>
          <div className="floating-search-bar compact-bar">
            <SearchForm /> 
          </div>
        </div>
      </div>

      {isSearching ? (
        <div className="main-layout-grid">
           <button className="mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
              <SlidersHorizontal size={18} /> Filters
           </button>
           
           <aside className={`filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
              <div className="sidebar-header-mobile">
                  <h3>Filters</h3>
                  <button onClick={() => setIsMobileFilterOpen(false)}><X size={20}/></button>
              </div>
              <div className="sidebar-sticky-content">
                  <div className="filter-card">
                      <div className="card-header">
                          <h4>Max Price</h4>
                          <span className="price-tag">LKR {priceRange[1].toLocaleString()}</span>
                      </div>
                      <div className="histogram-wrapper">
                          <input type="range" min="0" max="100000" step="1000" value={priceRange[1]} onChange={(e) => setPriceRange([0, Number(e.target.value)])} className="modern-range" />
                      </div>
                  </div>
                  
                  <div className="filter-card">
                      <div className="card-header"><h4>Star Rating</h4></div>
                      <select value={selectedRating} onChange={(e) => setSelectedRating(Number(e.target.value))} className="form-input">
                          <option value="0">All Ratings</option><option value="3">3+ Stars</option><option value="4">4+ Stars</option><option value="4.5">4.5+ Stars</option>
                      </select>
                  </div>
                  
                  <div className="filter-card">
                      <div className="card-header"><h4>Amenities</h4></div>
                      <div className="amenities-scroll-area">
                          {amenitiesList.map(am => (
                              <label key={am} className="amenity-row">
                                  <input type="checkbox" checked={selectedAmenities.includes(am)} onChange={(e) => { if(e.target.checked) setSelectedAmenities([...selectedAmenities, am]); else setSelectedAmenities(selectedAmenities.filter(x => x !== am)); }} />
                                  <span className="custom-check"></span>
                                  <span className="amenity-name">{am}</span>
                              </label>
                          ))}
                      </div>
                  </div>
                  <button onClick={handleClearFilters} className="btn-primary-outline" style={{width: '100%'}}>Clear Filters</button>
              </div>
           </aside>

           <main className="results-feed">
               <div className="results-toolbar">
                  <div className="result-count">
                      <strong>{loading ? 'Searching...' : filteredHotels.length}</strong> properties found
                  </div>
               </div>

               {loading ? renderSkeletons(6) : (
                   filteredHotels.length > 0 ? (
                       <div className="hotel-grid-modern">
                           {filteredHotels.map(hotel => (
                               <div key={hotel.id || hotel._id} className="hotel-card-wrapper">
                                   <HotelCard hotel={hotel} />
                               </div>
                           ))}
                       </div>
                   ) : (
                       <div className="empty-state">
                           <div className="empty-icon"><MapPin size={36}/></div>
                           <h3>No hotel found</h3>
                           <p>Try checking the spelling or adjusting your filters.</p>
                           <button onClick={handleClearFilters} className="btn-primary-outline">View all hotels</button>
                       </div>
                   )
               )}
           </main>
        </div>
      ) : (
        <div className="showcase-container">
            <section className="showcase-section">
                <div className="section-title">
                    <div className="icon-badge yellow"><Star size={24} fill="currentColor" /></div>
                    <h2>Top Rated Stays</h2>
                    <p>Guests love these 5-star experiences</p>
                </div>
                {loading ? renderSkeletons(4) : (
                    <div className="hotel-grid-modern">
                        {topHotels.map(hotel => (
                            <div key={hotel.id || hotel._id} className="hotel-card-wrapper">
                                <HotelCard hotel={hotel} />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="showcase-section">
                <div className="section-title">
                    <div className="icon-badge blue"><Zap size={24} fill="currentColor" /></div>
                    <h2>New & Trending</h2>
                    <p>Be the first to explore these new additions</p>
                </div>
                {loading ? renderSkeletons(4) : (
                    <div className="hotel-grid-modern">
                        {newHotels.map(hotel => (
                            <div key={hotel.id || hotel._id} className="hotel-card-wrapper">
                                <HotelCard hotel={hotel} />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
      )}
    </div>
  )
}

export default HotelShowcase