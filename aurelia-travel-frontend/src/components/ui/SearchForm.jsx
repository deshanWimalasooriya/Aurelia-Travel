import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Calendar, User, Users, Loader2 } from 'lucide-react'
import './styles/SearchForm.css'

const SearchForm = () => {
  const navigate = useNavigate()
  
  const [searchData, setSearchData] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0
  })

  const [isSearching, setIsSearching] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setIsSearching(true)

    // --- NEW LOGIC START ---
    // Remove all spaces to handle "k a ndy" -> "kandy" or "KanD y" -> "KanDy"
    // This allows the user to type broken words and still send a solid keyword.
    const cleanedDestination = searchData.destination.replace(/\s+/g, '');
    // --- NEW LOGIC END ---

    setTimeout(() => {
        // Construct Query Params using the cleaned destination
        const params = new URLSearchParams({
            location: cleanedDestination, // Updated to use the cleaned version
            checkIn: searchData.checkIn,
            checkOut: searchData.checkOut,
            adults: searchData.adults,
            children: searchData.children
        }).toString();

        navigate(`/hotels?${params}`) 
        setIsSearching(false)
    }, 600)
  }

  return (
    <form className="search-form-container" onSubmit={handleSearch}>
      
      {/* 1. Destination */}
      <div className="search-group destination-group">
        <label>Where to?</label>
        <div className="input-wrapper">
          <MapPin size={18} className="search-icon" />
          <input 
            type="text" 
            name="destination"
            placeholder="Hotel, City, or Province..." 
            value={searchData.destination}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="divider-vertical"></div>

      {/* 2. Check-in */}
      <div className="search-group date-group">
        <label>Check-in</label>
        <div className="input-wrapper">
          <Calendar size={18} className="search-icon" />
          <input 
            type="date" 
            name="checkIn"
            value={searchData.checkIn}
            onChange={handleInputChange}
            className="date-input-field"
          />
        </div>
      </div>

      <div className="divider-vertical"></div>

      {/* 3. Check-out */}
      <div className="search-group date-group">
        <label>Check-out</label>
        <div className="input-wrapper">
          <Calendar size={18} className="search-icon" />
          <input 
            type="date" 
            name="checkOut"
            value={searchData.checkOut}
            onChange={handleInputChange}
            className="date-input-field"
          />
        </div>
      </div>

      <div className="divider-vertical"></div>

      {/* 4. Adults */}
      <div className="search-group guest-group">
        <label>Adults</label>
        <div className="input-wrapper">
          <User size={18} className="search-icon" />
          <input 
            type="number" 
            name="adults"
            min="1"
            value={searchData.adults}
            onChange={handleInputChange}
            className="guest-input"
          />
        </div>
      </div>

      {/* 5. Children */}
      <div className="search-group guest-group">
        <label>Children</label>
        <div className="input-wrapper">
          <Users size={18} className="search-icon" />
          <input 
            type="number" 
            name="children"
            min="0"
            value={searchData.children}
            onChange={handleInputChange}
            className="guest-input"
          />
        </div>
      </div>

      {/* 6. Search Button */}
      <button 
        type="submit" 
        className={`search-submit-btn ${isSearching ? 'loading' : ''}`}
        disabled={isSearching}
      >
        {isSearching ? <Loader2 className="animate-spin" size={24} /> : (
          <>
            <Search size={20} />
            <span>Search</span>
          </>
        )}
      </button>

    </form>
  )
}

export default SearchForm