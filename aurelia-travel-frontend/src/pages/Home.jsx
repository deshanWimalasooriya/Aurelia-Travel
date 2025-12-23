import { useState, useEffect } from 'react'
import HotelCard from '../components/ui/HotelCard'
import SearchForm from '../components/ui/SearchForm'
import Slider from '../components/ui/Slider'
import Stats from '../components/ui/Stats'
import { mockHotels, mockStats } from '../data/mockHotels'
import './styles/Home.css'

const Home = () => {
  const [hotels, setHotels] = useState([])

  useEffect(() => {
    setHotels(mockHotels)
  }, [])

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
          <section>
            <h2>Top Hotels</h2>
            <div className="hotel-grid">
              {hotels.slice(0, 8).map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel}/>
              ))}
            </div>
          </section>
          <section>
            <h2>New Hotels</h2>
            <div className="hotel-grid">
              {hotels.slice(0, 8).map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export default Home
