import { useState } from 'react'
import { Calendar, Users, Plus, Minus } from 'lucide-react'
import './styles/SearchForm.css'

const SearchForm = () => {
  const [searchData, setSearchData] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    rooms: 1
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData(prev => ({ ...prev, [name]: value }))
  }

  const handleIncrement = (field) => {
    setSearchData(prev => ({ ...prev, [field]: prev[field] + 1 }))
  }

  const handleDecrement = (field) => {
    if (searchData[field] > 0) {
      setSearchData(prev => ({ ...prev, [field]: prev[field] - 1 }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Search submitted:', searchData)
  }

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="search-grid">
        <div className="search-field">
          <label className="search-label">Where</label>
          <input
            type="text"
            name="location"
            value={searchData.location}
            onChange={handleInputChange}
            placeholder="City or location"
            className="search-input"
          />
        </div>
        
        <div className="search-field">
          <label className="search-label">Check-in</label>
          <div className="search-input-wrapper">
            <input
              type="date"
              name="checkIn"
              value={searchData.checkIn}
              onChange={handleInputChange}
              className="search-input date-input"
            />
            <Calendar className="search-icon" size={20} />
          </div>
        </div>
        
        <div className="search-field">
          <label className="search-label">Check-out</label>
          <div className="search-input-wrapper">
            <input
              type="date"
              name="checkOut"
              value={searchData.checkOut}
              onChange={handleInputChange}
              className="search-input date-input"
            />
            <Calendar className="search-icon" size={20} />
          </div>
        </div>
        
        <div className="search-field">
          <label className="search-label">Guests</label>
          <div className="guests-counter">
            <button
              type="button"
              onClick={() => handleDecrement('adults')}
              className="counter-btn"
            >
              <Minus size={16} />
            </button>
            <span className="counter-value">{searchData.adults} Adults</span>
            <button
              type="button"
              onClick={() => handleIncrement('adults')}
              className="counter-btn"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        
        <div className="search-field search-submit">
          <button type="submit" className="search-btn">
            Search Hotels
          </button>
        </div>
      </div>
    </form>
  )
}

export default SearchForm
