import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, Map, Calendar, DollarSign, Users, Compass, 
  Car, Train, Footprints, Sparkles, Navigation, LocateFixed,
  Coffee, Mountain, Landmark, Heart, Crown, Bike
} from 'lucide-react';
import Button from './Button';

// Vibe Options with Lucide Icons
const VIBES = [
  { id: 'Relaxing', label: 'Relaxing', icon: Coffee },
  { id: 'Adventure', label: 'Adventure', icon: Mountain },
  { id: 'Culture', label: 'Culture', icon: Landmark },
  { id: 'Romantic', label: 'Romantic', icon: Heart },
  { id: 'Luxury', label: 'Luxury', icon: Crown }
];

// Transport Mode Options with Lucide Icons
const TRANSPORT_MODES = [
  { id: 'Private Van', label: 'Private Van', icon: Car },
  { id: 'Tuk-Tuk', label: 'Tuk-Tuk', icon: Bike },
  { id: 'Scenic Train', label: 'Scenic Train', icon: Train },
  { id: 'Walking', label: 'Walking', icon: Footprints }
];

const DESTINATIONS = [
  { city: 'Galle', label: 'Galle (Southern Coast & Dutch Fort)' },
  { city: 'Kandy', label: 'Kandy (Central Highlands & Sacred Tooth Temple)' },
  { city: 'Ella', label: 'Ella (Misty Peaks & Nine Arches Bridge)' },
  { city: 'Colombo', label: 'Colombo (Commercial Capital & Oceanfront)' },
  { city: 'Sigiriya', label: 'Sigiriya (Ancient Lion Rock Fortress)' },
  { city: 'Mirissa', label: 'Mirissa (Palm Bays & Whale Watching)' },
  { city: 'Nuwara Eliya', label: 'Nuwara Eliya (Little England & Tea Country)' }
];

export default function PlannerContainer({ 
  onGenerate, 
  mapStart = '', 
  mapEnd = '',
  loading = false,
  className = ''
}) {
  const [formData, setFormData] = useState({
    startLocation: 'Colombo',
    destinationCity: 'Galle',
    durationDays: 2,
    guests: 2,
    budgetUSD: 250,
    vibe: 'Relaxing',
    transportMode: 'Private Van'
  });

  // Listen to clicks on the interactive map
  useEffect(() => {
    if (mapStart) setFormData(prev => ({ ...prev, startLocation: mapStart }));
  }, [mapStart]);

  useEffect(() => {
    if (mapEnd) setFormData(prev => ({ ...prev, destinationCity: mapEnd }));
  }, [mapEnd]);

  // Geolocation Handler
  const handleCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
          setFormData(prev => ({ ...prev, startLocation: `My GPS (${coords})` }));
        },
        () => alert('Unable to retrieve location. Please check browser permissions.')
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onGenerate) {
      onGenerate(formData);
    }
  };

  return (
    <div className={`w-full max-w-xl ${className}`}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl transition-colors duration-300 space-y-6"
      >
        {/* Form Title & Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold mb-1">
              <Sparkles size={13} className="text-blue-600 dark:text-blue-400" />
              AI Itinerary Architect
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Design Your <span className="text-blue-600 dark:text-blue-400">Getaway</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCurrentLocation}
            title="Use Current Device GPS"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <LocateFixed size={18} />
          </button>
        </div>

        {/* 1. LOCATIONS: Start & Destination */}
        <div className="space-y-4">
          {/* Starting Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-600 dark:text-blue-400" /> Starting From
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.startLocation}
                onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                placeholder="e.g. Colombo or Click on Map"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-sm font-medium border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                Departure
              </span>
            </div>
          </div>

          {/* Destination Hub */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Map size={14} className="text-blue-600 dark:text-blue-400" /> Destination Hub
            </label>
            <select
              value={formData.destinationCity}
              onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-sm font-medium border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              required
            >
              {DESTINATIONS.map(d => (
                <option key={d.city} value={d.city}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. DURATION & GUEST COUNTER GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Duration Selector (1-5 Days) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600 dark:text-blue-400" /> Duration
            </label>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              {[1, 2, 3, 4, 5].map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setFormData({ ...formData, durationDays: d })}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                    formData.durationDays === d
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Guest Counter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users size={14} className="text-blue-600 dark:text-blue-400" /> Travelers
            </label>
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                {formData.guests} {formData.guests === 1 ? 'Guest' : 'Guests'}
              </span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, guests: Math.min(8, prev.guests + 1) }))}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 3. INTERACTIVE BUDGET SLIDER (USD) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={14} className="text-blue-600 dark:text-blue-400" /> Total Budget
            </label>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
              ${Number(formData.budgetUSD).toLocaleString()} USD
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="1500"
            step="25"
            value={formData.budgetUSD}
            onChange={(e) => setFormData({ ...formData, budgetUSD: Number(e.target.value) })}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-semibold">
            <span>$50 (Budget)</span>
            <span>$500 (Comfort)</span>
            <span>$1,500+ (Luxury)</span>
          </div>
        </div>

        {/* 4. VIBE SELECTOR PILLS */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Compass size={14} className="text-blue-600 dark:text-blue-400" /> Travel Vibe
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(v => {
              const IconComponent = v.icon;
              const isSelected = formData.vibe === v.id;
              return (
                <motion.button
                  key={v.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, vibe: v.id })}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <IconComponent size={13} />
                  <span>{v.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 5. TRANSPORT MODE PILLS */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Navigation size={14} className="text-blue-600 dark:text-blue-400" /> Preferred Transport
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TRANSPORT_MODES.map(t => {
              const IconComponent = t.icon;
              const isSelected = formData.transportMode === t.id;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, transportMode: t.id })}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl text-xs font-bold border transition cursor-pointer text-center ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <IconComponent size={16} className="mb-1" />
                  <span>{t.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 6. SUBMIT CTA BUTTON */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          icon={<Sparkles size={18} />}
          className="w-full py-4 text-base tracking-wide"
        >
          {loading ? 'Synthesizing Your Smart Plan...' : 'Generate AI Smart Plan'}
        </Button>
      </motion.form>
    </div>
  );
}
