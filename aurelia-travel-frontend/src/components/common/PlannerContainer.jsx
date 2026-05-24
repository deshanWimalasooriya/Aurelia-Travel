import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Wallet, Car, CloudRain, AlertTriangle, Clock,
  Users, Flag, Plus, Minus, Wifi, Check, FileText, Home
} from 'lucide-react';
import api from '../../services/api';
import './styles/plannerContainer.css';

// Hardcoded fallback amenities — used if the API call fails, so the form
// always works. Slugs match common aurelia amenity slugs where possible.
const FALLBACK_AMENITIES = [
  { slug: 'wifi', name: 'Free WiFi' },
  { slug: 'breakfast', name: 'Breakfast' },
  { slug: 'pool', name: 'Swimming Pool' },
  { slug: 'ac', name: 'Air Conditioning' },
  { slug: 'parking', name: 'Free Parking' },
  { slug: 'pet_friendly', name: 'Pet Friendly' },
  { slug: 'gym', name: 'Gym' },
  { slug: 'spa', name: 'Spa' },
  { slug: 'restaurant', name: 'Restaurant' },
  { slug: 'beach_access', name: 'Beach Access' },
];

const PACE_OPTIONS = ['Adventure', 'Relaxed', 'Cultural', 'Family', 'Romantic', 'Nature'];

const Counter = ({ icon, label, value, onChange, min = 0 }) => (
  <div className="counter-group">
    <span className="counter-label">{icon} {label}</span>
    <div className="counter-controls">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}><Minus size={14} /></button>
      <span className="counter-value">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}><Plus size={14} /></button>
    </div>
  </div>
);

const PlannerContainer = ({ onSubmit }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    startLocation: '',
    endLocation: '',
    startDate: '',
    hasVehicle: 'no',
    duration: 3,
    budget: '',
    pace: 'relaxed',
    customPace: '',
    adults: 2,
    children: 0,
    rooms: 1,
    weatherPreference: '',
    tripDescription: '',
    amenities: [],
  });

  const [amenityOptions, setAmenityOptions] = useState(FALLBACK_AMENITIES);

  useEffect(() => {
    let active = true;
    api.get('/amenities')
      .then((res) => {
        const data = res?.data?.data;
        if (active && Array.isArray(data) && data.length) {
          const seen = new Set();
          const opts = [];
          data.forEach((a) => {
            const slug = a.slug || (a.name || '').toLowerCase().replace(/\s+/g, '_');
            if (slug && !seen.has(slug)) {
              seen.add(slug);
              opts.push({ slug, name: a.name || slug });
            }
          });
          if (opts.length) setAmenityOptions(opts.slice(0, 16));
        }
      })
      .catch(() => { /* keep fallback list */ });
    return () => { active = false; };
  }, []);

  const toggleAmenity = (slug) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(slug)
        ? prev.amenities.filter((s) => s !== slug)
        : [...prev.amenities, slug],
    }));
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      pace: formData.customPace.trim() ? formData.customPace.trim() : formData.pace,
      amenityNames: amenityOptions.filter(a => formData.amenities.includes(a.slug)).map(a => a.name),
    };
    if (onSubmit) onSubmit(payload);
    else navigate('/travel-itinerary', { state: { formData: payload } });
  };

  return (
    <div className="planner-container">
      <form className="planner-card" onSubmit={handleGenerate}>

        <div className="input-group">
          <label><MapPin size={16} /> Starting From</label>
          <input type="text" placeholder="e.g. Colombo, Sri Lanka"
            value={formData.startLocation}
            onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })} required />
        </div>

        <div className="input-group">
          <label><Flag size={16} /> Destination <span className="optional-hint">(optional — blank for round trip)</span></label>
          <input type="text" placeholder="e.g. Ella, Sri Lanka"
            value={formData.endLocation}
            onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })} />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label><Clock size={16} /> Start Date</label>
            <input type="datetime-local" value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
          </div>
          <div className="input-group">
            <label><Car size={16} /> Transportation</label>
            <select value={formData.hasVehicle}
              onChange={(e) => setFormData({ ...formData, hasVehicle: e.target.value })}>
              <option value="no">Need Vehicle Arranged</option>
              <option value="yes">Have Own Vehicle</option>
            </select>
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label><Calendar size={16} /> Duration</label>
            <select value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}>
              {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d} {d === 1 ? 'Day' : 'Days'}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label><Wallet size={16} /> Total Budget (LKR)</label>
            <input type="number" placeholder="e.g. 50000" value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })} required />
          </div>
        </div>

        <div className="counters-block">
          <label className="block-label"><Users size={16} /> Who's Travelling</label>
          <div className="counters-row">
            <Counter icon={<Users size={14} />} label="Adults" value={formData.adults} min={1}
              onChange={(v) => setFormData({ ...formData, adults: v })} />
            <Counter icon={<Users size={14} />} label="Children" value={formData.children} min={0}
              onChange={(v) => setFormData({ ...formData, children: v })} />
            <Counter icon={<Home size={14} />} label="Rooms" value={formData.rooms} min={1}
              onChange={(v) => setFormData({ ...formData, rooms: v })} />
          </div>
        </div>

        <div className="pace-selector">
          <label>Desired Trip Pace</label>
          <div className="pace-options">
            {PACE_OPTIONS.map((p) => (
              <button key={p} type="button"
                className={formData.pace === p.toLowerCase() && !formData.customPace ? 'active' : ''}
                onClick={() => setFormData({ ...formData, pace: p.toLowerCase(), customPace: '' })}>
                {p}
              </button>
            ))}
          </div>
          <input type="text" className="custom-pace-input"
            placeholder="Or type your own vibe (e.g. photography road trip, wellness retreat)"
            value={formData.customPace}
            onChange={(e) => setFormData({ ...formData, customPace: e.target.value })} />
        </div>

        <div className="amenities-block">
          <label className="block-label"><Wifi size={16} /> Must-have Amenities</label>
          <div className="amenities-grid">
            {amenityOptions.map((a) => {
              const checked = formData.amenities.includes(a.slug);
              return (
                <button key={a.slug} type="button"
                  className={`amenity-chip ${checked ? 'checked' : ''}`}
                  onClick={() => toggleAmenity(a.slug)}>
                  <span className="chip-check">{checked ? <Check size={12} /> : null}</span>
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="input-group">
          <label><FileText size={16} /> Describe Your Dream Trip</label>
          <textarea rows={3}
            placeholder="Tell us what you imagine — scenery, must-see places, food, special occasions, anything that matters to you."
            value={formData.tripDescription}
            onChange={(e) => setFormData({ ...formData, tripDescription: e.target.value })} />
        </div>

        <div className="input-group">
          <label><CloudRain size={16} /> Weather Preference <span className="optional-hint">(optional)</span></label>
          <input type="text" placeholder="e.g. avoid rain, prefer cool weather"
            value={formData.weatherPreference}
            onChange={(e) => setFormData({ ...formData, weatherPreference: e.target.value })} />
        </div>

        <button type="submit" className="generate-btn">
          {onSubmit ? 'Add to Current Trip' : 'Generate Itinerary'}
        </button>
      </form>

      {!onSubmit && (
        <aside className="safety-sidebar">
          <h3><CloudRain size={20} className="icon-primary" /> Smart Insights</h3>
          <div className="insight-item">
            <AlertTriangle className="warning-icon" size={20} />
            <p><strong>Real-time Check:</strong> Live weather and real hotel availability are factored into your routing.</p>
          </div>
        </aside>
      )}
    </div>
  );
};

export default PlannerContainer;
