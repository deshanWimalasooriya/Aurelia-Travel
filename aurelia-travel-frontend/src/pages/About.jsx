import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Map as MapIcon, ArrowRight, Zap, Star } from 'lucide-react';
import './styles/about.css';

// --- CUSTOM ANIMATED MAP COMPONENT ---
// This creates the high-end glowing route animation
const AnimatedMap = () => {
  return (
    <div className="animated-map-container">
      <svg viewBox="0 0 800 400" className="map-svg">
        {/* Abstract Map Grid Lines for Tech Vibe */}
        <path d="M0 100 H800 M0 200 H800 M0 300 H800 M200 0 V400 M400 0 V400 M600 0 V400" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        
        {/* The Glowing Route Path */}
        <motion.path
          d="M 100 300 C 250 300, 300 150, 450 150 S 600 250, 700 100"
          fill="transparent"
          stroke="var(--color-primary, #2563eb)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 3, ease: "easeInOut" }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(37,99,235,0.8))' }}
        />

        {/* The Traveling Pulse (Moves along the path) */}
        <motion.circle
          r="6"
          fill="#ffffff"
          style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }}
          initial={{ cx: 100, cy: 300, opacity: 0 }}
          whileInView={{
            cx: [100, 250, 300, 450, 600, 700],
            cy: [300, 300, 150, 150, 250, 100],
            opacity: [0, 1, 1, 1, 1, 0]
          }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 3, ease: "easeInOut", times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
        />
      </svg>

      {/* Glassmorphic Popups */}
      <motion.div 
        className="map-popup popup-1"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1 }}
      >
        <Zap size={14} className="popup-icon" /> Route Optimized
      </motion.div>

      <motion.div 
        className="map-popup popup-2"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 2 }}
      >
        <Shield size={14} className="popup-icon" /> Weather Cleared
      </motion.div>
    </div>
  );
};


// --- MAIN ABOUT PAGE ---
const About = () => {
  return (
    <motion.div 
      className="about-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* 1. THE HOOK (Hero Section) */}
      <section className="about-hero">
        <div className="hero-gradient-overlay"></div>
        <div className="container hero-content">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <span className="hero-kicker">THE AURELIA PHILOSOPHY</span>
            <h1>Time is the ultimate luxury.</h1>
            <p className="hero-subtext">
              You have the resources to travel, but not the hours to plan it. Aurelia Travel was built on a simple premise: curating your perfect escape shouldn't feel like a second job.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. THE CORE PROBLEM */}
      <section className="problem-section container">
        <div className="split-layout">
          <motion.div 
            className="text-block"
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>The Micro-Vacation Dilemma</h2>
            <p>
              High-achieving professionals often find themselves with sudden, 48-to-72 hour windows of free time. 
              Yet, the friction of coordinating transport, vetting luxury stays, and checking real-time weather logistics 
              causes analysis paralysis. By the time the itinerary is built, the weekend is over.
            </p>
            <p><strong>We eliminate the friction.</strong></p>
          </motion.div>
          <motion.div 
            className="image-block"
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img src="https://images.unsplash.com/photo-1542314831-c6a4d1409e50?q=80&w=1000&auto=format&fit=crop" alt="Luxury Travel" className="rounded-image shadow-heavy" />
          </motion.div>
        </div>
      </section>

      {/* 3. THE AURELIA ENGINE (With Animated Map) */}
      <section className="engine-section">
        <div className="container">
          <div className="text-center engine-header">
            <span className="section-tag">HOW IT WORKS</span>
            <h2>The Intelligent Concierge Engine</h2>
            <p>Provide your time window and budget. Our proprietary engine handles the rest instantly.</p>
          </div>
          
          {/* Render our custom map animation here */}
          <AnimatedMap />
          
          <div className="engine-features">
            <div className="feature-card glass-card">
              <Clock className="icon-gold" size={28} />
              <h3>Precision Timing</h3>
              <p>Every itinerary is mathematically calculated to maximize your 24, 48, or 72-hour window. Zero wasted minutes.</p>
            </div>
            <div className="feature-card glass-card">
              <Star className="icon-gold" size={28} />
              <h3>Curated Luxury</h3>
              <p>We cross-reference thousands of properties, filtering only top-tier stays and fine dining experiences.</p>
            </div>
            <div className="feature-card glass-card">
              <Shield className="icon-gold" size={28} />
              <h3>Dynamic Risk Assessment</h3>
              <p>Real-time algorithmic checks on weather patterns and road conditions ensure your journey is flawless.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BY THE NUMBERS (Social Proof) */}
      <section className="stats-section container">
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-number">10k+</span>
            <span className="stat-label">Data Points Analyzed Per Trip</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">12 hrs</span>
            <span className="stat-label">Average Planning Time Saved</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">50+</span>
            <span className="stat-label">Exclusive Luxury Partners</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">100%</span>
            <span className="stat-label">Transparent Pricing</span>
          </div>
        </div>
      </section>

      {/* 5. THE COMMITMENT / CTA */}
      <section className="cta-section">
        <div className="container text-center">
          <h2>Ready to reclaim your time?</h2>
          <p>Stop planning. Start experiencing. Let Aurelia orchestrate your next escape today.</p>
          <button className="btn-premium mt-4">
            Start Your Journey <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </motion.div>
  );
};

export default About;