import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- `motion` is used as <motion.div>
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Search, Route, DollarSign, CheckCircle2, X } from 'lucide-react';

import SkeletonCard from '../components/ui/SkeletonCard';
import TripWizard from '../components/planner/TripWizard';
import { tripLength } from '../components/planner/tripUtils';
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

// Keeps both pins in view: fits the route when both exist, otherwise centres on one
const MapCameraController = ({ startCoords, endCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (startCoords && endCoords) {
      map.flyToBounds(
        [[startCoords.lat, startCoords.lng], [endCoords.lat, endCoords.lng]],
        { padding: [80, 80], paddingTopLeft: [460, 80], duration: 1.4, maxZoom: 11 }
      );
    } else if (endCoords || startCoords) {
      const c = endCoords || startCoords;
      map.flyTo([c.lat, c.lng], 11, { duration: 1.4 });
    }
  }, [startCoords, endCoords, map]);

  return null;
};

// Map clicks only do something while the user is explicitly picking a place
const MapLocationPicker = ({ active, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      if (!active) return;
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// ============================================================================
// 3. MAIN COMPONENT: TRAVELPAGE
// ============================================================================
const isoDate = (offsetDays) => new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
const knownCoords = (town) => {
  const c = CITY_COORDINATES[town?.trim()];
  return c ? { lat: c[0], lng: c[1] } : null;
};

export default function TravelPage() {
  const navigate = useNavigate();

  // Trip details (mirrors what travel-Agent-2.0 needs)
  const [formData, setFormData] = useState({
    startLocation: 'Colombo',
    destinationCity: '',
    startDate: isoDate(1),
    endDate: isoDate(3),
    budgetUSD: 300,
    adults: 2,
    children: 0,
    guests: 2,            // adults + children (used by the built-in fallback generator)
    rooms: 1,
    roomsTouched: false,  // stop auto-suggesting rooms once the user sets them
    vibe: 'Relaxing',
    ownTransport: false,
    transportMode: 'Private Van',
    tripDescription: '',
    weatherPreference: '',
    amenities: []
  });
  const durationDays = Math.max(1, tripLength(formData.startDate, formData.endDate));

  // Map pins: { text, coords } for start (blue) and destination (green)
  const [startLoc, setStartLoc] = useState({ text: 'Colombo', coords: knownCoords('Colombo') });
  const [endLoc, setEndLoc] = useState(null);
  const [pickTarget, setPickTarget] = useState(null); // null | 'start' | 'end'
  const [placeStatus, setPlaceStatus] = useState({ start: '', end: '' });

  // AI Pipeline Execution State
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState(null);
  // Real progress reported by travel-Agent-2.0: { stage, progress, detail }
  const [agentProgress, setAgentProgress] = useState(null);
  const pollCancelledRef = useRef(false);

  useEffect(() => () => { pollCancelledRef.current = true; }, []);

  // Cycling multi-step loading indicators (only while no real agent progress is available)
  useEffect(() => {
    let interval;
    if (loading && !agentProgress) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [loading, agentProgress]);

  // Esc cancels map picking
  useEffect(() => {
    if (!pickTarget) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setPickTarget(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickTarget]);

  const setStatus = (target, text) => setPlaceStatus(prev => ({ ...prev, [target]: text }));
  const setPin = (target, pin) => (target === 'start' ? setStartLoc(pin) : setEndLoc(pin));
  const fieldFor = (target) => (target === 'start' ? 'startLocation' : 'destinationCity');

  // Coordinates -> real town name, so the agent can compute distances & weather
  const lookupTown = async ({ lat, lng }) => {
    try {
      const { data } = await api.get('/smart-plan/reverse-geocode', { params: { lat, lng } });
      return data?.town || null;
    } catch {
      return null;
    }
  };

  // A place was chosen on the map or by GPS
  const placeFromCoords = async (target, coords) => {
    setPickTarget(null);
    const fallback = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    setPin(target, { text: fallback, coords });
    setStatus(target, 'Finding town…');
    const town = await lookupTown(coords);
    setPin(target, { text: town || fallback, coords });
    setFormData(prev => ({ ...prev, [fieldFor(target)]: town || fallback }));
    setStatus(target, town ? 'Pinned on map' : 'Pinned (town not found)');
  };

  // A town was typed (or a chip clicked): put it on the map
  const handlePlaceCommit = async (target, overrideText) => {
    const text = (overrideText ?? formData[fieldFor(target)]).trim();
    const current = target === 'start' ? startLoc : endLoc;
    if (text.length < 2) { setPin(target, null); setStatus(target, ''); return; }
    if (current?.text === text) return;

    const known = knownCoords(text);
    if (known) { setPin(target, { text, coords: known }); setStatus(target, 'Pinned on map'); return; }

    setStatus(target, 'Finding on map…');
    try {
      const { data } = await api.get('/smart-plan/geocode', { params: { q: text } });
      setPin(target, { text, coords: { lat: data.lat, lng: data.lng } });
      setStatus(target, 'Pinned on map');
    } catch {
      setPin(target, null);
      setStatus(target, "Couldn't find this town — check the spelling");
    }
  };

  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location access.');
      return;
    }
    setStatus('start', 'Getting your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => placeFromCoords('start', { lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setStatus('start', '');
        setError('Could not get your location. Allow location access or type a town.');
      }
    );
  };

  // Map agent stages onto the 3 existing loading steps
  const AGENT_STAGE_TO_STEP = { planning: 1, hotels: 0, weather: 2, assembling: 2, done: 2 };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // travel-Agent-2.0: start a job, then poll until the itinerary is ready.
  // Returns { itinerary, routeOptions } or throws so the caller can fall back.
  const runTripAgent = async () => {
    const start = await api.post('/smart-plan/agent/start', {
      startLocation: formData.startLocation,
      destinationCity: formData.destinationCity,
      startDate: formData.startDate,
      endDate: formData.endDate,
      durationDays,
      budgetUSD: formData.budgetUSD,
      adults: formData.adults,
      children: formData.children,
      rooms: formData.rooms,
      vibe: formData.vibe,
      ownTransport: formData.ownTransport,
      transportMode: formData.transportMode,
      tripDescription: formData.tripDescription,
      weatherPreference: formData.weatherPreference,
      amenities: formData.amenities
    });
    const { jobId } = start.data;
    setAgentProgress({ stage: 'planning', progress: 2, detail: 'Starting the AI trip agent...' });

    const MAX_WAIT_MS = 15 * 60 * 1000; // local models can take several minutes
    const startedAt = Date.now();
    while (Date.now() - startedAt < MAX_WAIT_MS) {
      await sleep(3000);
      if (pollCancelledRef.current) throw new Error('cancelled');
      const { data } = await api.get(`/smart-plan/agent/status/${jobId}`);
      if (data.status === 'done') return data;
      if (data.status === 'error') throw new Error(data.message || 'Agent failed');
      setAgentProgress({ stage: data.stage, progress: data.progress, detail: data.detail });
      setLoadingStepIndex(AGENT_STAGE_TO_STEP[data.stage] ?? 0);
    }
    throw new Error('Agent timed out');
  };

  // Submit: try travel-Agent-2.0 first, then POST /api/smart-plan/generate
  const handleGenerateItinerary = async () => {
    setLoading(true);
    setError(null);
    setAgentProgress(null);
    setPickTarget(null);
    pollCancelledRef.current = false;
    const plannerData = { ...formData, durationDays, guests: formData.adults + formData.children };

    try {
      const agentResult = await runTripAgent();
      if (agentResult?.itinerary) {
        navigate('/travel-itinerary', {
          state: { itinerary: agentResult.itinerary, routeOptions: agentResult.routeOptions, formData: plannerData }
        });
        return;
      }
    } catch (agentErr) {
      if (agentErr.message === 'cancelled') return;
      console.warn('Trip agent unavailable, using built-in Smart Plan generator:', agentErr.message);
      setAgentProgress(null);
    }

    try {
      const response = await api.post('/smart-plan/generate', {
        startLocation: plannerData.startLocation,
        destinationCity: plannerData.destinationCity,
        durationDays: plannerData.durationDays,
        budgetUSD: plannerData.budgetUSD,
        vibe: plannerData.vibe,
        transportMode: plannerData.ownTransport ? 'Own Vehicle' : plannerData.transportMode,
        guests: plannerData.guests
      });

      if (response.data && response.data.success) {
        const generatedItinerary = response.data.data;
        setTimeout(() => {
          navigate('/travel-itinerary', { state: { itinerary: generatedItinerary, formData: plannerData } });
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
          destinationCity: plannerData.destinationCity,
          vibe: plannerData.vibe,
          durationDays: plannerData.durationDays,
          budgetUSD: plannerData.budgetUSD,
          transportMode: plannerData.transportMode,
          tripTitle: `${plannerData.destinationCity} ${plannerData.vibe} Escapade`
        };
        navigate('/travel-itinerary', { state: { itinerary: simulatedPlan, formData: plannerData } });
      }, 1200);
    }
  };

  return (
    <div className="travel-plan-page tw-preflight relative w-full h-[calc(100vh-76px)] overflow-hidden">

      {/* ==================================================================== */}
      {/* 1. FULL-BLEED LEAFLET MAP BACKGROUND (Free OpenStreetMap Tiles)       */}
      {/* ==================================================================== */}
      <MapContainer
        center={[7.8731, 80.7718]}
        zoom={8}
        minZoom={6}
        zoomControl={false}
        className={`absolute inset-0 z-0 w-full h-full ${pickTarget ? 'cursor-crosshair' : ''}`}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, cursor: pickTarget ? 'crosshair' : undefined }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapCameraController startCoords={startLoc?.coords} endCoords={endLoc?.coords} />
        <MapLocationPicker active={Boolean(pickTarget)} onLocationSelect={(coords) => placeFromCoords(pickTarget, coords)} />

        {startLoc?.coords && (
          <Marker position={[startLoc.coords.lat, startLoc.coords.lng]} icon={createPulsingPinIcon(`From: ${startLoc.text}`, '#2563eb')}>
            <Popup><div className="p-1 font-sans text-xs"><strong className="text-blue-600 block uppercase">Starting from</strong>{startLoc.text}</div></Popup>
          </Marker>
        )}

        {endLoc?.coords && (
          <Marker position={[endLoc.coords.lat, endLoc.coords.lng]} icon={createPulsingPinIcon(`To: ${endLoc.text}`, '#10b981')}>
            <Popup><div className="p-1 font-sans text-xs"><strong className="text-emerald-600 block uppercase">Going to</strong>{endLoc.text}</div></Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map-picking banner */}
      {pickTarget && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-3 px-4 py-2.5 rounded-full bg-amber-500 text-white text-sm font-semibold shadow-xl">
          <MapPin size={16} />
          <span>Click the map to set your {pickTarget === 'start' ? 'starting point' : 'destination'}</span>
          <button type="button" onClick={() => setPickTarget(null)} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/25 hover:bg-white/40 text-xs cursor-pointer">
            <X size={12} /> Cancel
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. FLOATING TRIP WIZARD (Z-[1000] Above Leaflet)                     */}
      {/* ==================================================================== */}
      <div
        className="absolute top-6 left-4 lg:left-12 z-[1000] w-[calc(100%-2rem)] md:w-[26rem] p-5 rounded-2xl shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 max-h-[calc(100%-3rem)] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <TripWizard
          form={formData}
          setForm={setFormData}
          pickTarget={pickTarget}
          onPickOnMap={setPickTarget}
          onGPS={handleDetectGPS}
          onPlaceCommit={handlePlaceCommit}
          placeStatus={placeStatus}
          onSubmit={handleGenerateItinerary}
          loading={loading}
          error={error}
          onClearError={() => setError(null)}
        />
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

              {/* Real progress from travel-Agent-2.0 */}
              {agentProgress && (
                <div className="text-left space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="truncate pr-2">{agentProgress.detail}</span>
                    <span>{agentProgress.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700"
                      style={{ width: `${agentProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Checking real driving distances, weather and hotel availability — this can take a few minutes.
                  </p>
                </div>
              )}

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
