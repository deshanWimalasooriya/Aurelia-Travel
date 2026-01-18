import { useState, useEffect } from 'react'
import api from '../services/api' // ✅ Use api client
import HotelCard from '../components/ui/HotelCard'
import SearchForm from '../components/ui/SearchForm'
import { Star, Zap } from 'lucide-react'
import './styles/HotelPage.css'

const HotelShowcase = () => {
  const [topHotels, setTopHotels] = useState([])
  const [newHotels, setNewHotels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // ✅ Use configured api client
        const [topRes, newRes] = await Promise.all([
          api.get('/hotels/top-rated'),
          api.get('/hotels/newest')
        ])

        // ✅ Robust Data Extraction: Handle both array and { data: [...] } formats
        const topData = Array.isArray(topRes.data) ? topRes.data : (topRes.data.data || []);
        const newData = Array.isArray(newRes.data) ? newRes.data : (newRes.data.data || []);

        setTopHotels(topData.slice(0, 5))
        setNewHotels(newData.slice(0, 5))

        console.log('Top Hotels:', topData)
        console.log('New Hotels:', newData)
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="loading-container"><div className="loader-spinner"></div></div>

  return (
    <div className="page-wrapper">
      
      {/* HERO SECTION WITH SEARCH */}
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

      {/* SHOWCASE CONTENT */}
      <div className="showcase-container">
        
        {/* SECTION 1: TOP RATED */}
        <section className="showcase-section">
            <div className="section-title">
                <div className="icon-badge yellow"><Star size={20} fill="#ca8a04" /></div>
                <h2>Top Rated Stays</h2>
                <p>Guests love these 5-star experiences</p>
            </div>
            
            <div className="hotel-grid-modern">
                {topHotels.map(hotel => (
                    <div key={hotel.id || hotel._id} className="hotel-card-wrapper">
                        <HotelCard hotel={hotel} />
                    </div>
                ))}
            </div>
        </section>

        {/* SECTION 2: NEW ARRIVALS */}
        <section className="showcase-section">
            <div className="section-title">
                <div className="icon-badge blue"><Zap size={20} fill="#3b82f6" /></div>
                <h2>New & Trending</h2>
                <p>Be the first to explore these new additions</p>
            </div>

            <div className="hotel-grid-modern">
                {newHotels.map(hotel => (
                    <div key={hotel.id || hotel._id} className="hotel-card-wrapper">
                        <HotelCard hotel={hotel} />
                    </div>
                ))}
            </div>
        </section>

      </div>
    </div>
  )
}

export default HotelShowcase