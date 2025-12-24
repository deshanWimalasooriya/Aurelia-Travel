import { useState, useEffect } from 'react'
import axios from 'axios'
import HotelCard from '../components/ui/HotelCard'
import SearchForm from '../components/ui/SearchForm'
import Slider from '../components/ui/Slider'
import Stats from '../components/ui/Stats'
import './styles/Home.css'

const Home = () => {
  const [topRatedHotels, setTopRatedHotels] = useState([])
  const [newestHotels, setNewestHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔍 Fetching hotels from backend...')
        
        const [topRatedRes, newestRes] = await Promise.all([
          axios.get('http://localhost:5000/api/hotels/top-rated'),
          axios.get('http://localhost:5000/api/hotels/newest')
        ])
        
        console.log('✅ Top Rated Response:', topRatedRes.data)
        console.log('✅ Newest Response:', newestRes.data)
        
        // Handle different backend response structures
        setTopRatedHotels(Array.isArray(topRatedRes.data) ? topRatedRes.data : topRatedRes.data.data || [])
        setNewestHotels(Array.isArray(newestRes.data) ? newestRes.data : newestRes.data.data || [])
        
      } catch (err) {
        console.error('❌ Error fetching hotels:', err.response?.data || err.message)
        setError(err.response?.data?.message || 'Failed to load hotels')
      } finally {
        setLoading(false)
      }
    }

    fetchHotels()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg">Loading hotels...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="hero">
        <Slider />
        <div className="hero-content">
          <div className="hero-text">
            <h1>Discover Your Perfect Stay</h1>
            <p>Book luxury hotels, resorts and more at unbeatable prices</p>
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="listings">
        <div className="container">
          <Stats />
          
          {/* Top Rated Hotels */}
          <section>
            <h2>Top Rated Hotels</h2>
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Retry
                </button>
              </div>
            ) : topRatedHotels.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No top rated hotels found</p>
            ) : (
              <div className="hotel-grid">
                {topRatedHotels.slice(0, 8).map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </section>

          {/* Newest Hotels */}
          <section>
            <h2>New Hotels</h2>
            {topRatedHotels.length === 0 && newestHotels.length === 0 && !error ? (
              <p className="text-gray-500 text-center py-8">No new hotels found</p>
            ) : (
              <div className="hotel-grid">
                {newestHotels.slice(0, 8).map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}

export default Home
