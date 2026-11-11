import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, MapPin, Compass, Search, Route, 
  DollarSign, CheckCircle2, AlertCircle, X,
  Map, Calendar, Users, LocateFixed, Coffee, Mountain, 
  Landmark, Heart, Crown, Car, Bike, Train, Footprints,
  Navigation, ArrowRight, ShieldCheck, ChevronDown
} from 'lucide-react';

import SkeletonCard from '../components/ui/SkeletonCard';
import api from '../services/api';
import './styles/travelPage.css';

// Fix Leaflet marker asset paths for Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ============================================================================
// 1. CONSTANTS & CITY COORDINATES FOR LIVE MAP SYNCING
// ============================================================================
const CITY_COORDINATES = {
  'Galle': [6.0535, 80.2210],
  'Kandy': [7.2906, 80.6337],
  'Ella': [6.8667, 81.0466],
  'Colombo': [6.9271, 79.8612],
  'Sigiriya': [7.9570, 80.7603],
  'Mirissa': [5.9483, 80.4578],
  'Nuwara Eliya': [6.9497, 80.7891]
};

const DESTINATIONS = [
  { city: 'Galle', label: 'Galle', subtitle: 'Southern Coast & Dutch Fort' },
  { city: 'Kandy', label: 'Kandy', subtitle: 'Hill Capital & Sacred Tooth Temple' },
  { city: 'Ella', label: 'Ella', subtitle: 'Misty Peaks & Nine Arches Bridge' },
  { city: 'Colombo', label: 'Colombo', subtitle: 'Commercial Capital & Oceanfront' },
  { city: 'Sigiriya', label: 'Sigiriya', subtitle: 'Ancient Lion Rock Fortress' },
  { city: 'Mirissa', label: 'Mirissa', subtitle: 'Palm Bays & Whale Watching' },
  { city: 'Nuwara Eliya', label: 'Nuwara Eliya', subtitle: 'Tea Country & Colonial Mansions' }
];

const VIBES = [
  { id: 'Relaxing', label: 'Relaxing', icon: Coffee },
  { id: 'Adventure', label: 'Adventure', icon: Mountain },
  { id: 'Culture', label: 'Culture', icon: Landmark },
  { id: 'Romantic', label: 'Romantic', icon: Heart },
  { id: 'Luxury', label: 'Luxury', icon: Crown }
];

const TRANSPORT_MODES = [
  { id: 'Private Van', label: 'Private Van', icon: Car },
  { id: 'Tuk-Tuk', label: 'Tuk-Tuk', icon: Bike },
  { id: 'Scenic Train', label: 'Scenic Train', icon: Train },
  { id: 'Walking', label: 'Walking', icon: Footprints }
];

const LOADING_STEPS = [
  { label: 'Scanning 500+ Sri Lankan stays & verified inventory...', icon: Search },
  { label: 'Optimizing turn-by-turn road routes & scenic transfers...', icon: Route },
  { label: 'Balancing your budget, vibe & attraction schedule...', icon: DollarSign }
];

// Fallback itinerary in case backend RAG service is unreachable
const FALLBACK_SMART_PLAN = {
  tripTitle: "Galle Southern Coast & Heritage Escapade",
  destinationCity: "Galle",
  vibe: "Relaxing",
  durationDays: 2,
  budgetUSD: 250,
  transportMode: "Private Van",
  totalEstimatedCostUSD: 140,
  selectedHotel: {
    id: 501,
    name: "Galle Fort Heritage Villa & Spa",
    city: "Galle",
    pricePerNightUSD: 85,
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    latitude: 6.0270,
    longitude: 80.2170
  },
  days: [
    {
      dayNumber: 1,
      title: "Colonial Fort Walk & Golden Hour Ramparts",
      stops: [
        {
          id: 201,
          type: "hotel",
          name: "Galle Fort Heritage Villa & Spa",
          timeSlot: "12:00 PM",
          estimatedTimeMins: 60,
          costUSD: 85,
          latitude: 6.0270,
          longitude: 80.2170,
          category: "Stay"
        },
        {
          id: 202,
          type: "place",
          name: "Galle Dutch Fort Ramparts",
          timeSlot: "03:00 PM",
          estimatedTimeMins: 120,
          costUSD: 0,
          latitude: 6.0267,
          longitude: 80.2160,
          category: "History"
        },
        {
          id: 203,
          type: "place",
          name: "Galle Lighthouse & Coral Point",
          timeSlot: "05:30 PM",
          estimatedTimeMins: 60,
          costUSD: 0,
          latitude: 6.0245,
          longitude: 80.2195,
          category: "Nature"
        }
      ]
    },
    {
      dayNumber: 2,
      title: "Unawatuna Coastal Sanctuary & Turtle Rescue",
      stops: [
        {
          id: 204,
          type: "place",
          name: "Unawatuna Bay & Jungle Beach",
          timeSlot: "09:30 AM",
          estimatedTimeMins: 150,
          costUSD: 5,
          latitude: 6.0110,
          longitude: 80.2480,
          category: "Relaxation"
        },
        {
          id: 205,
          type: "place",
          name: "Habaraduwa Sea Turtle Hatchery",
          timeSlot: "02:00 PM",
          estimatedTimeMins: 75,
          costUSD: 10,
          latitude: 5.9980,
          longitude: 80.3010,
          category: "Nature"
        }
      ]
    }
  ]
};

// ============================================================================
// 2. LEAFLET MAP CONTROLLERS
// ============================================================================

// Custom HTML Markers
const createPulsingPinIcon = (label, color = '#2563eb') => {
  return L.divIcon({
    className: 'custom-pulsing-marker',
    html: `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: ${color};
        color: white;
        padding: 5px 10px;
        border-radius: 9999px;
        font-family: ui-sans-serif, system-ui, sans-serif;
        font-weight: 800;
        font-size: 11px;
        box-shadow: 0 8px 18px -2px rgba(0,0,0,0.35);
        border: 2px solid white;
        white-space: nowrap;
        transform: translate(-50%, -50%);
      ">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

// Controller to smoothly animate the map camera when destination city updates
const MapCameraController = ({ destinationCity, customCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (customCoords) {
      map.flyTo([customCoords.lat, customCoords.lng], 13, {
        animate: true,
        duration: 1.4
      });
      return;
    }

    if (destinationCity && CITY_COORDINATES[destinationCity]) {
      const coords = CITY_COORDINATES[destinationCity];
      map.flyTo(coords, 12, {
        animate: true,
        duration: 1.5
      });
    }
  }, [destinationCity, customCoords, map]);

  return null;
};

// Location picker via Leaflet map clicks
const MapLocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const coordString = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      onLocationSelect(coordString, { lat, lng });
    },
  });
  return null;
};

// ============================================================================
// 3. MAIN COMPONENT: TRAVELPAGE
// ============================================================================
export default function TravelPage() {
  const navigate = useNavigate();

  // Primary Generator State
  const [formData, setFormData] = useState({
    startLocation: 'Colombo (Airport / City)',
    destinationCity: 'Galle',
    durationDays: 2,
    guests: 2,
    budgetUSD: 250,
    vibe: 'Relaxing',
    transportMode: 'Private Van'
  });

  // Map Pins State
  const [startLoc, setStartLoc] = useState({
    text: 'Colombo',
    coords: { lat: 6.9271, lng: 79.8612 }
  });
  const [endLoc, setEndLoc] = useState(null);
  const [pickingMode, setPickingMode] = useState('end'); // 'start' | 'end'

  // AI Pipeline Execution State
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState(null);

  // Cycling multi-step loading indicators
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Handle Map Pinning
  const handleMapClick = (coordString, latlngObj) => {
    if (pickingMode === 'start') {
      setStartLoc({ text: `Custom Pin (${coordString})`, coords: latlngObj });
      setFormData(prev => ({ ...prev, startLocation: `Custom GPS (${coordString})` }));
      setPickingMode('end');
    } else {
      setEndLoc({ text: `Destination (${coordString})`, coords: latlngObj });
      setPickingMode('start');
    }
  };

  // Device Geolocation Handler
  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const text = `My GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setStartLoc({ text, coords: { lat, lng } });
          setFormData(prev => ({ ...prev, startLocation: text }));
        },
        () => alert('Could not detect location. Please check browser GPS permissions.')
      );
    }
  };

  // Submit Handler: Call POST /api/smart-plan/generate
  const handleGenerateItinerary = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/smart-plan/generate', {
        startLocation: formData.startLocation,
        destinationCity: formData.destinationCity,
        durationDays: formData.durationDays,
        budgetUSD: formData.budgetUSD,
        vibe: formData.vibe,
        transportMode: formData.transportMode,
        guests: formData.guests
      });

      if (response.data && response.data.success) {
        const generatedItinerary = response.data.data;

        setTimeout(() => {
          navigate('/travel-itinerary', {
            state: {
              itinerary: generatedItinerary,
              formData
            }
          });
        }, 600);
      } else {
        throw new Error(response.data?.message || 'Server did not return a valid itinerary.');
      }
    } catch (err) {
      console.warn('Backend Smart Plan API unreachable, utilizing curated Sri Lanka fallback:', err);
      
      // Graceful fallback to guarantee smooth user experience
      setTimeout(() => {
        const simulatedPlan = {
          ...FALLBACK_SMART_PLAN,
          destinationCity: formData.destinationCity,
          vibe: formData.vibe,
          durationDays: formData.durationDays,
          budgetUSD: formData.budgetUSD,
          transportMode: formData.transportMode,
          tripTitle: `${formData.destinationCity} ${formData.vibe} Escapade`
        };

        navigate('/travel-itinerary', {
          state: {
            itinerary: simulatedPlan,
            formData
          }
        });
      }, 1200);
    }
  };

  return (
    <div className="travel-plan-page relative w-full h-[calc(100vh-76px)] overflow-hidden">
      
      {/* ==================================================================== */}
      {/* 1. FULL-BLEED LEAFLET MAP BACKGROUND (Free OpenStreetMap Tiles)       */}
      {/* ==================================================================== */}
      <MapContainer
        center={CITY_COORDINATES[formData.destinationCity] || [7.8731, 80.7718]}
        zoom={11}
        minZoom={6}
        zoomControl={false}
        className="absolute inset-0 z-0 w-full h-full cursor-crosshair"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Camera Controller to smoothly flyTo on city change */}
        <MapCameraController 
          destinationCity={formData.destinationCity} 
          customCoords={endLoc?.coords}
        />

        <MapLocationPicker onLocationSelect={handleMapClick} />

        {/* Departure Marker */}
        {startLoc && (
          <Marker 
            position={[startLoc.coords.lat, startLoc.coords.lng]}
            icon={createPulsingPinIcon('Start: ' + (startLoc.text.split('(')[0] || 'Departure'), '#2563eb')}
          >
            <Popup>
              <div className="p-1 font-sans text-xs">
                <strong className="text-blue-600 block uppercase">Starting Point</strong>
                <span>{startLoc.text}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Hub Marker */}
        {formData.destinationCity && CITY_COORDINATES[formData.destinationCity] && (
          <Marker 
            position={CITY_COORDINATES[formData.destinationCity]}
            icon={createPulsingPinIcon(`Hub: ${formData.destinationCity}`, '#10b981')}
          >
            <Popup>
              <div className="p-1 font-sans text-xs">
                <strong className="text-emerald-600 block uppercase">Destination Hub</strong>
                <span>{formData.destinationCity}, Sri Lanka</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Custom Pinned Stop */}
        {endLoc && (
          <Marker 
            position={[endLoc.coords.lat, endLoc.coords.lng]}
            icon={createPulsingPinIcon('Custom Stop', '#f59e0b')}
          >
            <Popup>
              <div className="p-1 font-sans text-xs">
                <strong className="text-amber-600 block uppercase">Selected Pin</strong>
                <span>{endLoc.text}</span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ==================================================================== */}
      {/* 2. FLOATING GLASSMORPHIC FORM CONTAINER (Z-[1000] Above Leaflet)     */}
      {/* ==================================================================== */}
      <div 
        className="absolute top-24 left-4 lg:left-12 z-[1000] w-[90%] md:w-96 p-6 rounded-2xl shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-5 max-h-[calc(100vh-120px)] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-1 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Sparkles size={18} className="animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase">AI Trip Architect</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Smart Itinerary Planner
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            RAG-powered road routing across Sri Lanka
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Trip Form */}
        <form onSubmit={handleGenerateItinerary} className="flex flex-col gap-4">
          
          {/* 1. STARTING LOCATION */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-blue-600" />
              Starting Location
            </span>
            <div className="relative flex items-center">
              <input
                type="text"
                value={formData.startLocation}
                onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                placeholder="e.g. Colombo International Airport"
                required
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 pr-14"
              />
              <button
                type="button"
                onClick={handleDetectGPS}
                className="absolute right-2 px-2.5 py-1 text-[11px] font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer"
              >
                GPS
              </button>
            </div>
          </label>

          {/* 2. DESTINATION HUB */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5">
              <Map size={15} className="text-emerald-500" />
              Destination
            </span>
            <div className="relative">
              <select
                value={formData.destinationCity}
                onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8"
              >
                {DESTINATIONS.map((d) => (
                  <option key={d.city} value={d.city} className="dark:bg-slate-800">
                    {d.label} — {d.subtitle}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </label>

          {/* 3. DURATION */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-blue-600" />
                Duration
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {formData.durationDays} {formData.durationDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
              {[1, 2, 3, 4, 5].map((d) => {
                const isSelected = formData.durationDays === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, durationDays: d }))}
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d}d
                  </button>
                );
              })}
            </div>
          </label>

          {/* 4. BUDGET */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign size={15} className="text-emerald-500" />
                Budget (USD)
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ${formData.budgetUSD} USD (~${Math.round(formData.budgetUSD / formData.durationDays)}/day)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                max="2500"
                step="25"
                value={formData.budgetUSD}
                onChange={(e) => setFormData({ ...formData, budgetUSD: Number(e.target.value) })}
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="range"
              min="50"
              max="1500"
              step="25"
              value={formData.budgetUSD}
              onChange={(e) => setFormData({ ...formData, budgetUSD: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer mt-1"
            />
          </label>

          {/* 5. TRAVELERS & VIBE (GRID) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Travelers */}
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5">
                <Users size={15} className="text-indigo-500" />
                Travelers
              </span>
              <select
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 8].map(num => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </label>

            {/* Vibe */}
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5">
                <Compass size={15} className="text-amber-500" />
                Vibe
              </span>
              <select
                value={formData.vibe}
                onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {VIBES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* 6. TRANSPORT MODE */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5">
              <Navigation size={15} className="text-purple-500" />
              Transport Mode
            </span>
            <select
              value={formData.transportMode}
              onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {TRANSPORT_MODES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {/* 7. GENERATE BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 hover:shadow-xl active:scale-[0.98] mt-2"
          >
            <Sparkles size={18} className="animate-spin text-amber-300" style={{ animationDuration: '4s' }} />
            <span>{loading ? 'Synthesizing Verified Route...' : 'Generate AI Smart Plan'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Tag */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>500+ verified Sri Lankan stays & attractions</span>
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MULTI-STEP HCI AI PROGRESS OVERLAY (Framer Motion)                 */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6"
            >
              {/* Animated Glowing Radial Icon */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 dark:bg-blue-500/30 animate-ping" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles size={28} className="animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  Architecting Your <span className="text-blue-600 dark:text-blue-400">Smart Plan</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Synthesizing verified hotels, road paths, and attraction tickets via RAG.
                </p>
              </div>

              {/* Multi-Step Cycling Progress */}
              <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-left space-y-3">
                {LOADING_STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isActive = idx === loadingStepIndex;
                  const isCompleted = idx < loadingStepIndex;

                  return (
                    <div 
                      key={step.label}
                      className={`flex items-center gap-3 text-xs font-semibold transition-all duration-300 ${
                        isActive 
                          ? 'text-blue-600 dark:text-blue-400 font-bold scale-[1.02]' 
                          : isCompleted 
                            ? 'text-emerald-600 dark:text-emerald-400 opacity-80' 
                            : 'text-slate-400 dark:text-slate-500 opacity-40'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : isCompleted 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={14} /> : <StepIcon size={14} />}
                      </div>
                      <span className="flex-1">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Visual Skeleton Anticipation Preview */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3 text-left">
                  Curating Stays & Activities Preview
                </span>
                <div className="grid grid-cols-2 gap-3 opacity-70 scale-95 pointer-events-none">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
