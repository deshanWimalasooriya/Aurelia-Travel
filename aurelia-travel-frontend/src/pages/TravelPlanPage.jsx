import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin, Navigation, Home, Flag, Calendar, CloudRain,
  Wallet, Loader, CheckCircle, AlertTriangle, Hotel, Compass
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { travelAPI } from '../services/api';
import './styles/travelPlanPage.css';

// Fix Leaflet's default marker icons (they break under bundlers otherwise).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// The visible progress steps, mapped to the agent's real stages.
const STEPS = [
  { key: 'planning', label: 'Pacing your route', icon: <Compass size={18} /> },
  { key: 'hotels', label: 'Finding real hotels', icon: <Hotel size={18} /> },
  { key: 'weather', label: 'Checking the weather', icon: <CloudRain size={18} /> },
  { key: 'assembling', label: 'Assembling itinerary', icon: <Navigation size={18} /> },
];

// Free geocoding via Open-Meteo (no key) to place towns on the map.
async function geocode(name) {
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name + ', Sri Lanka')}&count=1`
    );
    const j = await r.json();
    const hit = j.results && j.results[0];
    return hit ? [hit.latitude, hit.longitude] : null;
  } catch {
    return null;
  }
}

const TravelPlanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData;

  const [job, setJob] = useState({ status: 'starting', stage: 'planning', progress: 0, detail: 'Starting…' });
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const [activeRoute, setActiveRoute] = useState(0);
  const [points, setPoints] = useState([]); // [{name, coords}]
  const pollRef = useRef(null);

  // 1. Kick off the job when the page mounts.
  useEffect(() => {
    if (!formData) {
      setError('No trip details provided. Please start from the planner.');
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const { data } = await travelAPI.startPlan(formData);
        if (cancelled) return;
        pollRef.current = setInterval(() => poll(data.jobId), 3000);
      } catch (e) {
        setError('Could not start the planner. Is the service running?');
      }
    })();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poll = async (jobId) => {
    try {
      const { data } = await travelAPI.getPlanStatus(jobId);
      setJob(data);
      if (data.status === 'done') {
        clearInterval(pollRef.current);
        setItinerary(data.result);
      } else if (data.status === 'error') {
        clearInterval(pollRef.current);
        setError(data.error || 'Generation failed.');
      }
    } catch {
      // transient network blip; keep polling
    }
  };

  // 2. When an itinerary arrives (or active route changes), geocode its towns.
  useEffect(() => {
    if (!itinerary) return;
    const route = itinerary.routes[activeRoute];
    if (!route) return;

    (async () => {
      const towns = [];
      towns.push(formData.startLocation);
      route.daily_breakdown.forEach((d) => {
        const seg = (d.route_segment || '').split(/->|to/i);
        if (seg.length >= 2) towns.push(seg[seg.length - 1].trim());
      });
      if (formData.endLocation) towns.push(formData.endLocation);

      const resolved = [];
      for (const t of towns) {
        const c = await geocode(t);
        if (c) resolved.push({ name: t, coords: c });
      }
      setPoints(resolved);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary, activeRoute]);

  const mapCenter = useMemo(() => {
    if (points.length) return points[0].coords;
    return [7.8731, 80.7718]; // Sri Lanka center
  }, [points]);

  // ---------- RENDER: ERROR ----------
  if (error) {
    return (
      <div className="travel-plan-page">
        <div className="plan-state-center">
          <AlertTriangle size={48} className="state-icon error" />
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/travel-plan')}>Back to Planner</button>
        </div>
      </div>
    );
  }

  // ---------- RENDER: LOADING (animated progress) ----------
  if (!itinerary) {
    const currentIndex = STEPS.findIndex((s) => s.key === job.stage);
    return (
      <div className="travel-plan-page">
        <div className="plan-state-center">
          <div className="progress-ring">
            <Loader size={40} className="spin" />
            <span className="progress-pct">{job.progress || 0}%</span>
          </div>
          <h2>Designing your perfect escape</h2>
          <p className="progress-detail">{job.detail}</p>

          <div className="progress-steps">
            {STEPS.map((step, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <div key={step.key} className={`progress-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                  <div className="step-icon">{done ? <CheckCircle size={18} /> : step.icon}</div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
          <p className="progress-hint">This can take a minute or two — we're checking real hotels and live weather.</p>
        </div>
      </div>
    );
  }

  // ---------- RENDER: RESULT ----------
  const route = itinerary.routes[activeRoute];

  return (
    <div className="travel-plan-page">
      {/* LEFT: itinerary */}
      <div className="flow-sidebar">
        <header className="plan-header">
          <button onClick={() => navigate('/travel-plan')} className="back-link">← Plan another trip</button>
          <div className="budget-widget">
            <div className="budget-row">
              <span className="label"><Wallet size={16} /> Trip Summary</span>
            </div>
            <div className="budget-details-row"><span>{itinerary.trip_summary}</span></div>
          </div>
        </header>

        {/* Route option tabs */}
        <div className="route-tabs">
          {itinerary.routes.map((r, i) => (
            <button
              key={i}
              className={`route-tab ${i === activeRoute ? 'active' : ''}`}
              onClick={() => setActiveRoute(i)}
            >
              {r.path_name}
            </button>
          ))}
        </div>

        <div className="timeline-container">
          <div className="route-why">
            <Compass size={16} /> <span>{route.why_it_fits}</span>
          </div>

          <div className="special-node">
            <div className="node-icon"><Navigation size={20} /></div>
            <div className="node-content"><h3>Start</h3><p>{formData.startLocation}</p></div>
          </div>

          {route.daily_breakdown.map((day, i) => (
            <div key={i} className="day-group">
              <div className="day-header"><h2>Day {day.day_number}: {day.route_segment}</h2></div>
              <div className="activities-list">
                {day.activities.map((act, j) => (
                  <div key={j} className="activity-card location">
                    <div className="act-icon"><MapPin size={18} /></div>
                    <div className="act-details"><h4>{act}</h4></div>
                  </div>
                ))}
                <div className="activity-card stay">
                  <div className="act-icon"><Home size={18} /></div>
                  <div className="act-details">
                    <div className="act-top">
                      <h4>{day.hotel_name}</h4>
                      <span className="cost-tag">{day.hotel_price}</span>
                    </div>
                    <p>{day.room_configuration}</p>
                  </div>
                </div>
                {day.weather && (
                  <div className="weather-chip"><CloudRain size={14} /> {day.weather}</div>
                )}
              </div>
            </div>
          ))}

          <div className="special-node end">
            <div className="node-icon"><Flag size={20} /></div>
            <div className="node-content"><h3>Trip Complete</h3><p>{formData.endLocation || formData.startLocation}</p></div>
          </div>

          <a className="btn-primary maps-link" href={route.full_google_maps_url} target="_blank" rel="noreferrer">
            <Navigation size={16} /> Open full route in Google Maps
          </a>
        </div>
      </div>

      {/* RIGHT: live Leaflet map */}
      <div className="map-section">
        <MapContainer center={mapCenter} zoom={8} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p, i) => (
            <Marker key={i} position={p.coords}>
              <Popup>{p.name}</Popup>
            </Marker>
          ))}
          {points.length > 1 && (
            <Polyline positions={points.map((p) => p.coords)} color="#2563eb" weight={4} />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default TravelPlanPage;
