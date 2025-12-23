import { useState, useEffect } from 'react'
import './styles/Slider.css'

const Slider = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const slides = [
    { image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600', title: 'Luxury Beach Resorts' },
    { image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600', title: 'Heritage Hotels' },
    { image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600', title: 'City Hotels' }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <div className="slider">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`slide ${index === currentSlide ? 'active' : ''}`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="slide-image"
          />
        </div>
      ))}
      
      <div className="slider-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

export default Slider
