import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Map, Shield, TrendingUp } from 'lucide-react';
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
        <div className="about-hero-content">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Stop Planning. <span>Start Traveling.</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Aurelia Travel is an intelligent platform designed to turn your short free windows into perfectly optimized micro-vacations.
          </motion.p>
        </div>
      </section>

      {/* --- MISSION SECTION --- */}
      <section className="about-mission container">
        <div className="mission-card">
          <h2>The Problem: Analysis Paralysis</h2>
          <p>
            Working professionals and students often have sudden, short breaks (1–3 days). 
            However, the stress of coordinating transport, hotels, and weather often leads to 
            wasting that free time at home. 
          </p>
        </div>
        <div className="mission-card highlight">
          <h2>The Solution: Aurelia</h2>
          <p>
            We automate the logistics. You give us your <strong>Time Window</strong> and 
            <strong>Budget</strong>, and we generate a complete, risk-assessed Road Map 
            covering everything from departure to the final mile.
          </p>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="about-features container">
        <div className="feature-item">
          <div className="icon-box"><Clock size={32} /></div>
          <h3>Time Optimized</h3>
          <p>Itineraries generated specifically for 24, 48, or 72-hour windows.</p>
        </div>
        <div className="feature-item">
          <div className="icon-box"><Shield size={32} /></div>
          <h3>Risk Assessment</h3>
          <p>Real-time checks on weather, road conditions, and safety alerts.</p>
        </div>
        <div className="feature-item">
          <div className="icon-box"><TrendingUp size={32} /></div>
          <h3>Budget Clarity</h3>
          <p>Estimates total cost including hidden fees like fuel and food.</p>
        </div>
        <div className="feature-item">
          <div className="icon-box"><Map size={32} /></div>
          <h3>Smart Routing</h3>
          <p>Visual road maps that integrate stays and dining along the way.</p>
        </div>
      </section>
    </motion.div>
  );
};

export default About;