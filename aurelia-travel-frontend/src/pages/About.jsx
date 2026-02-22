import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Map, Shield, TrendingUp, Compass, Star } from 'lucide-react';
import './styles/about.css';

const About = () => {
  return (
    <motion.div 
      className="about-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* --- HERO SECTION --- */}
      <section className="about-hero">
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content container">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Redefining Travel. <span>Regaining Time.</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Aurelia Travel is an intelligent platform designed to turn your short free windows into perfectly optimized, luxury micro-vacations.
          </motion.p>
        </div>
      </section>

      {/* --- MISSION SECTION --- */}
      <section className="about-mission container">
        <div className="mission-card">
          <div className="mission-icon-wrapper"><Compass size={32} /></div>
          <h2>The Problem: Analysis Paralysis</h2>
          <p>
            Working professionals and high-achievers often have sudden, short breaks (1–3 days). 
            However, the stress of coordinating transport, hotels, and weather logistics often leads to 
            wasting that valuable free time at home. Planning a trip shouldn't feel like a second job.
          </p>
        </div>
        <div className="mission-card highlight">
          <div className="mission-icon-wrapper highlight-icon"><Star size={32} /></div>
          <h2>The Solution: Aurelia</h2>
          <p>
            We automate the logistics so you can focus on the experience. You provide your <strong>Time Window</strong> and 
            <strong>Budget</strong>, and our engine generates a complete, risk-assessed itinerary 
            covering everything from departure to the final mile, instantly.
          </p>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="about-features container">
        <div className="feature-item">
          <div className="icon-box"><Clock size={32} /></div>
          <h3>Time Optimized</h3>
          <p>Itineraries generated specifically for 24, 48, or 72-hour windows, ensuring zero wasted hours.</p>
        </div>
        <div className="feature-item">
          <div className="icon-box"><Shield size={32} /></div>
          <h3>Risk Assessment</h3>
          <p>Real-time algorithmic checks on weather patterns, road conditions, and safety alerts.</p>
        </div>
        <div className="feature-item">
          <div className="icon-box"><TrendingUp size={32} /></div>
          <h3>Budget Clarity</h3>
          <p>Transparent estimates covering total costs including hidden fees like fuel and daily meals.</p>
        </div>
        <div className="feature-item">
          <div className="icon-box"><Map size={32} /></div>
          <h3>Smart Routing</h3>
          <p>Visual road maps that seamlessly integrate luxury stays and fine dining along your route.</p>
        </div>
      </section>
    </motion.div>
  );
};

export default About;