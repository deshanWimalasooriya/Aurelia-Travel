import { useState, useEffect } from 'react'
import HotelCard from '../components/ui/HotelCard'
import { mockHotels } from '../data/mockHotels'
import './styles/searchResults.css'

const SearchResults = () => {
  const [hotels, setHotels] = useState([])
  const [filters, setFilters] = useState({
    priceRange: [0, 50000],
    rating: 0,
    facilities: [],
    roomType: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const hotelsPerPage = 8

  useEffect(() => {
    // In a real app, you'd fetch from API with filters
    setHotels(mockHotels)
  }, [])

  const filteredHotels = hotels.filter(hotel => {
    return (
      hotel.price >= filters.priceRange[0] &&
      hotel.price <= filters.priceRange[1] &&
      hotel.rating >= filters.rating &&
      (filters.roomType === '' || hotel.name.toLowerCase().includes(filters.roomType.toLowerCase()))
    )
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
  }

  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      priceRange: name === 'min' ? [value, prev.priceRange[1]] : [prev.priceRange[0], value]
    }))
  }

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-6">Filters</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    name="min"
                    value={filters.priceRange[0]}
                    onChange={handlePriceRangeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Min"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    name="max"
                    value={filters.priceRange[1]}
                    onChange={handlePriceRangeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Star Rating</label>
                <select
                  name="rating"
                  value={filters.rating}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="0">Any</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.8">4.8+ Stars</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                <select
                  name="roomType"
                  value={filters.roomType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">Any</option>
                  <option value="suite">Suite</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="standard">Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                <div className="space-y-2">
                  {['WiFi', 'Pool', 'Parking', 'AC', 'Restaurant'].map(facility => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        value={facility}
                        checked={filters.facilities.includes(facility)}
                        onChange={handleFilterChange}
                        className="mr-2"
                      />
                      {facility}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Search Results</h2>
              <p className="text-gray-600">{filteredHotels.length} hotels found</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedHotels.map(hotel => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 space-x-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded ${
                      currentPage === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
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
