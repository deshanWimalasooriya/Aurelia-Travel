import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api' 
import HotelCard from '../components/ui/HotelCard'
import SkeletonCard from '../components/ui/SkeletonCard' // <--- IMPORT SKELETON
import SearchForm from '../components/ui/SearchForm'
import { Star, Zap, SlidersHorizontal, X, MapPin } from 'lucide-react'
import './styles/HotelPage.css'

const HotelShowcase = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // --- 1. DATA STATES ---
  const [allHotels, setAllHotels] = useState([]) 
  const [topHotels, setTopHotels] = useState([])
  const [newHotels, setNewHotels] = useState([])
  const [loading, setLoading] = useState(true)

  // ... (Filter states remain the same) ...
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [selectedRating, setSelectedRating] = useState(0)
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // --- 3. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // ... (API calls remain the same) ...
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

  // ... (Derived state and memo logic remains the same) ...
  const locationQuery = searchParams.get('location') || '';
  const isSearching = locationQuery !== '' || selectedAmenities.length > 0 || selectedRating > 0;

  const filteredHotels = useMemo(() => {
      // ... (Keep existing filter logic) ...
      if (!isSearching) return [];
      const query = locationQuery.toLowerCase().trim();
      return allHotels.filter(hotel => {
        // ... match logic ...
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

  // ✅ HELPER: Render Skeletons Grid
  const renderSkeletons = (count = 4) => (
    <div className="hotel-grid-modern">
        {Array(count).fill(0).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div className="page-wrapper">
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

      {isSearching ? (
        <div className="main-layout-grid">
           {/* ... (Sidebar Filters - Keep Existing) ... */}
           <button className="mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
              <SlidersHorizontal size={18} /> Filters
           </button>
           <aside className={`filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
              {/* ... (Keep Sidebar Content) ... */}
              <div className="sidebar-header-mobile"><h3>Filters</h3><button onClick={() => setIsMobileFilterOpen(false)}><X size={20}/></button></div>
              <div className="sidebar-sticky-content">
                  <div className="filter-card">
                      <div className="card-header"><h4>Price Range (LKR)</h4></div>
                      <div className="px-4 pb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2"><span>{priceRange[0]}</span><span>{priceRange[1].toLocaleString()}</span></div>
                          <input type="range" min="0" max="100000" step="1000" value={priceRange[1]} onChange={(e) => setPriceRange([0, Number(e.target.value)])} className="w-full accent-blue-600" />
                      </div>
                  </div>
                  <div className="filter-card">
                      <div className="card-header"><h4>Star Rating</h4></div>
                      <select value={selectedRating} onChange={(e) => setSelectedRating(Number(e.target.value))} className="w-full p-2 border rounded-md">
                          <option value="0">All Ratings</option><option value="3">3+ Stars</option><option value="4">4+ Stars</option><option value="4.5">4.5+ Stars</option>
                      </select>
                  </div>
                  <div className="filter-card">
                      <div className="card-header"><h4>Amenities</h4></div>
                      <div className="amenities-scroll-area">
                          {amenitiesList.map(am => (
                              <label key={am} className="amenity-row">
                                  <input type="checkbox" checked={selectedAmenities.includes(am)} onChange={(e) => { if(e.target.checked) setSelectedAmenities([...selectedAmenities, am]); else setSelectedAmenities(selectedAmenities.filter(x => x !== am)); }} />
                                  <span className="amenity-name ml-2">{am}</span>
                              </label>
                          ))}
                      </div>
                  </div>
                  <button onClick={handleClearFilters} className="w-full mt-4 py-2 text-red-500 border border-red-200 rounded hover:bg-red-50">Clear Filters</button>
              </div>
           </aside>

           {/* Results Grid */}
           <main className="results-feed">
               <div className="results-toolbar mb-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Search Results</h2>
                  <span className="text-gray-500">
                    {loading ? 'Searching...' : `${filteredHotels.length} found`}
                  </span>
               </div>

               {/* ✅ UPDATED: Show Skeletons while loading */}
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
                       <div className="empty-state text-center py-20 bg-gray-50 rounded-xl">
                           <MapPin size={40} className="mx-auto text-gray-400 mb-4"/>
                           <h3 className="text-lg font-semibold text-gray-700">No hotel found</h3>
                           <p className="text-gray-500">Try checking the spelling (e.g. "Colombo") or adjusting your filters.</p>
                           <button onClick={handleClearFilters} className="mt-4 text-blue-600 underline">View all hotels</button>
                       </div>
                   )
               )}
           </main>
        </div>

      ) : (

        /* === VIEW 2: SHOWCASE (Top & New) === */
        <div className="showcase-container">
            <section className="showcase-section">
                <div className="section-title">
                    <div className="icon-badge yellow"><Star size={20} fill="#ca8a04" /></div>
                    <h2>Top Rated Stays</h2>
                    <p>Guests love these 5-star experiences</p>
                </div>
                {/* ✅ UPDATED: Skeletons for Top Rated */}
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
                    <div className="icon-badge blue"><Zap size={20} fill="#3b82f6" /></div>
                    <h2>New & Trending</h2>
                    <p>Be the first to explore these new additions</p>
                </div>
                {/* ✅ UPDATED: Skeletons for New Hotels */}
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