import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import HotelCard from '../components/ui/HotelCard';
import SearchForm from '../components/ui/SearchForm';
import { SlidersHorizontal, X, Star, Search, RotateCcw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import './styles/HotelPage.css';

const HotelSearch = () => {
  const [searchParams] = useSearchParams();
  const [rawHotels, setRawHotels] = useState([]); 
  const [amenityCategories, setAmenityCategories] = useState({}); 
  const [loading, setLoading] = useState(true);
  
  // --- FILTER STATES ---
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [priceRange, setPriceRange] = useState(100000); 
  const [maxPriceLimit, setMaxPriceLimit] = useState(100000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Collapsible State
  const [expandedCats, setExpandedCats] = useState({});

  const toggleCategory = (cat) => {
      setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch Top/Newest Hotels + Grouped Amenities
        const [topRes, newRes, amenitiesRes] = await Promise.all([
          api.get('/hotels/top-rated'),
          api.get('/hotels/newest'),
          api.get('/amenities?grouped=true') // ✅ Use backend grouping
        ]);

        // A. Handle Amenities
        const groupedData = amenitiesRes.data.success ? amenitiesRes.data.data : {};
        setAmenityCategories(groupedData);
        
        // Auto-expand all categories initially
        const initialExpanded = Object.keys(groupedData).reduce((acc, key) => ({...acc, [key]: true}), {});
        setExpandedCats(initialExpanded);

        // B. Handle Hotels
        const topList = Array.isArray(topRes.data.data) ? topRes.data.data : [];
        const newList = Array.isArray(newRes.data.data) ? newRes.data.data : [];
        const combined = [...topList, ...newList];
        
        // Deduplicate Hotels by ID
        const uniqueHotelsMap = new Map();
        combined.forEach(h => uniqueHotelsMap.set(h.id, h));
        const uniqueHotels = Array.from(uniqueHotelsMap.values());

        // C. Process Data for Filtering
        const processedHotels = uniqueHotels.map(hotel => {
            // Normalize Price
            let displayPrice = parseFloat(hotel.price_per_night_from || hotel.price || 0);
            
            // Normalize Amenities (Extract names for easier filtering)
            // Backend now sends [{ name: 'WiFi', ... }]
            const amenityList = Array.isArray(hotel.amenities) 
                ? hotel.amenities.map(a => (a.name || '').trim()) 
                : [];

            return {
                ...hotel,
                displayPrice,
                amenityNames: amenityList,
                ratingScore: parseFloat(hotel.rating_average || hotel.rating || 0)
            };
        });

        setRawHotels(processedHotels);

        // Calculate dynamic max price
        if (processedHotels.length > 0) {
            const maxP = Math.max(...processedHotels.map(h => h.displayPrice));
            const safeMax = Math.ceil(maxP + 5000); 
            setMaxPriceLimit(safeMax);
            setPriceRange(safeMax);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. FILTER LOGIC ---
  const filteredHotels = useMemo(() => {
      return rawHotels.filter(hotel => {
          // 1. Location Match
          const locParam = searchParams.get('location')?.toLowerCase() || '';
          const searchableText = `${hotel.name} ${hotel.city} ${hotel.country} ${hotel.address_line_1}`.toLowerCase();
          const matchesLocation = !locParam || searchableText.includes(locParam);

          // 2. Price Match
          const matchesPrice = hotel.displayPrice <= priceRange;

          // 3. Rating Match
          const matchesRating = selectedRating ? hotel.ratingScore >= selectedRating : true;

          // 4. Amenities Match (AND Logic)
          // Ensure Hotel contains ALL selected amenities
          const matchesAmenities = selectedAmenities.length === 0 || 
              selectedAmenities.every(selected => 
                  hotel.amenityNames.some(hAmenity => hAmenity.toLowerCase() === selected.toLowerCase())
              );

          return matchesLocation && matchesPrice && matchesRating && matchesAmenities;
      });
  }, [rawHotels, searchParams, priceRange, selectedRating, selectedAmenities]);


  // --- HANDLERS ---
  const toggleAmenity = (name) => {
      setSelectedAmenities(prev => 
          prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
      );
  };

  const handleClearFilters = () => {
      setSelectedAmenities([]);
      setSelectedRating(null);
      setPriceRange(maxPriceLimit);
  };

  if (loading) return (
      <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Curating the best stays...</p>
      </div>
  );

  return (
    <div className="page-wrapper">
      
      {/* HEADER */}
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

        {/* --- SIDEBAR FILTERS --- */}
        <aside className={`filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header-mobile">
            <h3>Filters</h3>
            <button onClick={() => setIsMobileFilterOpen(false)}><X size={24}/></button>
          </div>

          <div className="sidebar-sticky-content">
            
            <div className="filter-header-row">
                <h3>Filter Results</h3>
                {(selectedAmenities.length > 0 || selectedRating || priceRange < maxPriceLimit) && (
                    <button onClick={handleClearFilters} className="reset-link">
                        <RotateCcw size={12}/> Reset
                    </button>
                )}
            </div>

            {/* 1. Price Filter */}
            <div className="filter-card">
               <div className="card-header">
                   <h4>Price Range</h4>
               </div>
               <div className="histogram-wrapper">
                    <div className="range-value-display">Max: LKR {priceRange.toLocaleString()}</div>
                    <input 
                        type="range" min="0" max={maxPriceLimit} value={priceRange} 
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="modern-range"
                    />
               </div>
            </div>

            {/* 2. Star Rating */}
            <div className="filter-card">
               <div className="card-header"><h4>Star Rating</h4></div>
               <div className="rating-filter-row">
                   {[5, 4, 3].map(star => (
                       <button 
                           key={star}
                           className={`rating-btn ${selectedRating === star ? 'active' : ''}`}
                           onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                       >
                           {star}+ <Star size={12} fill="currentColor"/>
                       </button>
                   ))}
               </div>
            </div>
            
            {/* 3. Amenities Filter (Categorized) */}
            {Object.keys(amenityCategories).length > 0 ? (
                Object.entries(amenityCategories).map(([category, items]) => (
                    <div className="filter-card" key={category}>
                        <div 
                            className="card-header clickable" 
                            onClick={() => toggleCategory(category)}
                            style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                        >
                            <h4 style={{textTransform: 'capitalize'}}>{category}</h4>
                            {expandedCats[category] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </div>
                        
                        {expandedCats[category] && (
                            <div className="amenities-scroll-area">
                                {items.map(amenity => (
                                    <label key={amenity.id || amenity.name} className="amenity-row">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedAmenities.includes(amenity.name)} 
                                            onChange={() => toggleAmenity(amenity.name)}
                                        />
                                        <span className="custom-check"></span>
                                        <span className="amenity-name">{amenity.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="filter-card">
                    <div className="card-header"><h4>Amenities</h4></div>
                    <p className="empty-filter-msg">Loading amenities...</p>
                </div>
            )}

          </div>
        </aside>

        {/* --- RESULTS GRID --- */}
        <main className="results-feed">
          <div className="results-toolbar">
            <div className="result-count">
                <strong>{filteredHotels.length}</strong> properties found
                {searchParams.get('location') && <span> in "{searchParams.get('location')}"</span>}
            </div>
          </div>

          {filteredHotels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-circle"><Search size={32} /></div>
              <h3>No properties match your filters</h3>
              <p>Try adjusting your price range or removing some amenities.</p>
              <button onClick={handleClearFilters} className="btn-primary-outline">Clear Filters</button>
            </div>
          ) : (
            <div className="hotel-grid-modern">
              {filteredHotels.map(hotel => (
                <div className="hotel-card-wrapper" key={hotel.id}>
                    <HotelCard hotel={hotel} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HotelSearch;