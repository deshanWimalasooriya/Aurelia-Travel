import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import HotelCard from '../components/ui/HotelCard'
import SkeletonCard from '../components/ui/SkeletonCard' // ✅ Import Skeleton
import { Loader2 } from 'lucide-react'
import './styles/searchResults.css'

const SearchResults = () => {
  // ... (Keep existing state and filter logic) ...
  const location = useLocation()
  const [hotels, setHotels] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const hotelsPerPage = 8

  const [filters, setFilters] = useState({
    priceRange: [0, 100000], 
    rating: 0,
    facilities: [],
    roomType: '',
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

  // ... (Keep useEffect for location and filter logic const filteredHotels = ...) ...
  
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

  // ✅ HELPER: Skeleton Grid
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Filters Sidebar (Keep Existing) */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl p-6 shadow-lg sticky top-24">
              <h3 className="text-xl font-bold mb-6">Filters</h3>
              <div className="mb-6 border-b border-gray-100 pb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Global Search</label>
                <input type="text" name="searchQuery" value={filters.searchQuery} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Name, City, or Country..." />
                <label className="block text-sm font-medium text-gray-700 mb-2">Specific Location</label>
                <div className="grid grid-cols-1 gap-3">
                    <input type="text" name="district" value={filters.district} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="District / City" />
                    <input type="text" name="province" value={filters.province} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Province / State" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (LKR)</label>
                <div className="flex items-center space-x-2">
                  <input type="number" name="min" value={filters.priceRange[0]} onChange={handlePriceRangeChange} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Min" />
                  <span className="text-gray-500">-</span>
                  <input type="number" name="max" value={filters.priceRange[1]} onChange={handlePriceRangeChange} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Max" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Star Rating</label>
                <select name="rating" value={filters.rating} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded">
                  <option value="0">Any</option><option value="4">4+ Stars</option><option value="4.5">4.5+ Stars</option><option value="4.8">4.8+ Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                <div className="space-y-2">
                  {['WiFi', 'Pool', 'Parking', 'AC', 'Restaurant'].map(facility => (
                    <label key={facility} className="flex items-center cursor-pointer">
                      <input type="checkbox" value={facility} checked={filters.facilities.includes(facility)} onChange={handleFilterChange} className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                      <span className="text-gray-700">{facility}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
              <span className="text-gray-500 font-medium">
                {loading ? 'Searching...' : `${filteredHotels.length} properties found`}
              </span>
            </div>

            {/* ✅ UPDATED: Condition for Loading */}
            {loading ? renderSkeletons() : (
                filteredHotels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {paginatedHotels.map(hotel => (
                        <HotelCard key={hotel.id} hotel={hotel} />
                    ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <h3 className="text-xl font-semibold text-gray-700">No hotels found</h3>
                        <p className="text-gray-500 mt-2">Try checking your spelling or using broader search terms.</p>
                    </div>
                )
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-center mt-12 space-x-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{i + 1}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchResults