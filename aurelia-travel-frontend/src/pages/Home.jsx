import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom' 
import Slider from '../components/ui/Slider'
import './styles/Home.css'

const Home = () => {
  const [showIntro, setShowIntro] = useState(true)
  
  // Scroll Reveal Logic
  const revealRefs = useRef([])
  const addToRefs = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el)
    }
  }

  useEffect(() => {
    // 1. Cinematic Timer
    const timer = setTimeout(() => {
        setShowIntro(false)
    }, 2500); 

    // 2. Scroll Observer Setup
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 } // Trigger when 10% of element is visible
    )

    revealRefs.current.forEach((el) => observer.observe(el))

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [showIntro])

  return (
    <>
      {/* --- CINEMATIC PRELOADER (UNCHANGED) --- */}
      <div className={`preloader-overlay ${!showIntro ? 'fade-out' : ''}`}>
          <div className="brand-container">
              <h1 className="brand-text">Aurelia Travel</h1>
              <span className="brand-subtext">Discover the world</span>
          </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className={`content-wrapper ${showIntro ? 'blurred' : 'clear'}`}>
        
        {/* SECTION 1: HERO - The Hook */}
        <header className="hero-section">
             <div className="hero-bg"><Slider /></div>
             <div className="hero-overlay"></div>
             
             <div className="hero-content">
               <div className="animate-hero-text">
                 <h1 className="hero-title">
                   Stop Planning<br />
                   <span className="gradient-text">Start Traveling</span>
                 </h1>
                 <p className="hero-subtitle">
                   The world's first AI-powered travel concierge designed for the busy professional. 
                   Recover your time. We handle the details.
                 </p>
                 <div className="hero-cta-group">
                    <Link to="/plan-trip" className="btn-primary-glow">Generate My Trip</Link>
                    <a href="#how-it-works" className="btn-secondary-outline">How it Works</a>
                 </div>
               </div>
             </div>
             
             {/* Scroll Down Indicator */}
             <div className="scroll-indicator">
                <span>Explore</span>
                <div className="mouse"></div>
             </div>
        </header>

        {/* SECTION 2: THE "WHY" - Psychological Trigger (Time vs Stress) */}
        <section className="features-section">
            <div className="container">
                <div className="section-header" ref={addToRefs}>
                    <span className="badge">THE PROBLEM</span>
                    <h2>Planning a trip takes 30+ hours. <br/>We do it in 30 seconds.</h2>
                </div>

                <div className="feature-grid">
                    {/* Card 1 */}
                    <div className="feature-card" ref={addToRefs}>
                        <div className="icon-box">🧠</div>
                        <h3>AI-Driven Personalization</h3>
                        <p>Our algorithms learn your preferences to curate hotels and activities that match your specific taste, not generic lists.</p>
                    </div>
                    
                    {/* Card 2 */}
                    <div className="feature-card" ref={addToRefs}>
                        <div className="icon-box">⚡</div>
                        <h3>Instant Itineraries</h3>
                        <p>Forget spreadsheets. Get a day-by-day plan optimized for logistics, opening times, and your energy levels.</p>
                    </div>

                    {/* Card 3 */}
                    <div className="feature-card" ref={addToRefs}>
                        <div className="icon-box">💎</div>
                        <h3>Exclusive Access</h3>
                        <p>We aggregate premium stays and hidden gems that standard booking engines often miss.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 3: IMMERSIVE PARALLAX BANNER */}
        <section className="parallax-banner" ref={addToRefs}>
            <div className="parallax-content">
                <h2>"Time is the only luxury you can't buy back."</h2>
                <p>Don't waste it scrolling through reviews.</p>
            </div>
        </section>

        {/* SECTION 4: HOW IT WORKS (The Process) */}
        <section id="how-it-works" className="steps-section">
            <div className="container">
                <div className="section-header center" ref={addToRefs}>
                    <span className="badge">THE PROCESS</span>
                    <h2>Your Journey in 3 Steps</h2>
                </div>
                
                <div className="steps-row">
                    <div className="step-item" ref={addToRefs}>
                        <div className="step-number">01</div>
                        <h4>Tell us your vibe</h4>
                        <p>Select your dates and style (Relaxed, Adventure, Business).</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step-item" ref={addToRefs}>
                        <div className="step-number">02</div>
                        <h4>AI Generation</h4>
                        <p>Our engine scans 10,000+ data points to build your plan.</p>
                    </div>
                    <div className="step-line"></div>
                    <div className="step-item" ref={addToRefs}>
                        <div className="step-number">03</div>
                        <h4>Pack & Go</h4>
                        <p>Book hotels and activities instantly with one click.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 5: FINAL CTA - The Closer */}
        <section className="final-cta-section">
            <div className="cta-content" ref={addToRefs}>
                <h2>Ready to upgrade your travel experience?</h2>
                <p>Join thousands of smart travelers using Aurelia.</p>
                <Link to="/plan-trip" className="btn-white-shine">Start Free Trial</Link>
            </div>
        </section>

      </div>
    </>
  )
}

export default Home