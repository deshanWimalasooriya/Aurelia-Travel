import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  BedDouble, Camera, Navigation, Clock, RefreshCw, 
  Trash2, Star, Car, Train, Bike, Footprints, Layers, Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './styles/TripMapVisualizer.css';

// Fix Leaflet default marker icons for Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Expose Leaflet globally for UMD plugins like leaflet-routing-machine
if (typeof window !== 'undefined' && !window.L) {
  window.L = L;
}

// ============================================================================
// 1. CUSTOM HTML L.divIcon BUILDERS (Hotels vs Places)
// ============================================================================

/**
 * Creates an elevated hotel pill marker with a BedDouble SVG icon and price tag.
 */
const createHotelDivIcon = (price) => {
  return L.divIcon({
    className: 'custom-leaflet-marker-hotel',
    html: `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #ffffff;
        padding: 5px 12px;
        border-radius: 9999px;
        box-shadow: 0 10px 20px -3px rgba(217, 119, 6, 0.45), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        border: 2px solid #ffffff;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        font-weight: 800;
        font-size: 12px;
        letter-spacing: -0.01em;
        cursor: pointer;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"></path>
          <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"></path>
          <path d="M12 4v6"></path>
          <path d="M2 18h20"></path>
        </svg>
        <span>${price ? `$${price}/nt` : 'Stay'}</span>
      </div>
    `,
    iconSize: [0, 0],
    popupAnchor: [0, -22]
  });
};

/**
 * Creates a numbered sequence place marker with a category color ring.
 */
const createPlaceDivIcon = (sequenceNumber, category = '') => {
  const cat = (category || '').toLowerCase();
  let ringColor = '#3b82f6'; // Blue
  let bgColor = '#1d4ed8';

  if (cat.includes('nature')) {
    ringColor = '#10b981'; // Emerald
    bgColor = '#059669';
  } else if (cat.includes('history')) {
    ringColor = '#f59e0b'; // Amber
    bgColor = '#d97706';
  } else if (cat.includes('culture')) {
    ringColor = '#a855f7'; // Purple
    bgColor = '#7e22ce';
  } else if (cat.includes('adventure')) {
    ringColor = '#f97316'; // Orange
    bgColor = '#ea580c';
  } else if (cat.includes('relaxation') || cat.includes('beach')) {
    ringColor = '#06b6d4'; // Cyan
    bgColor = '#0891b2';
  }

  return L.divIcon({
    className: 'custom-leaflet-marker-place',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: ${bgColor};
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 13px;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        border: 2.5px solid #ffffff;
        outline: 3px solid ${ringColor};
        cursor: pointer;
        transform: translate(-50%, -50%);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      ">
        <span>${sequenceNumber}</span>
      </div>
    `,
    iconSize: [0, 0],
    popupAnchor: [0, -24]
  });
};

// ============================================================================
// 2. ROUTING ENGINE LOADER HOOK (Local npm or CDN fallback)
// ============================================================================

const useLeafletRoutingEngine = () => {
  const [isReady, setIsReady] = useState(
    typeof window !== 'undefined' && !!(window.L && window.L.Routing && window.L.Routing.control)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.L) window.L = L;

    if (window.L && window.L.Routing && window.L.Routing.control) {
      setIsReady(true);
      return;
    }

    // Inject CDN stylesheet if not present
    if (!document.getElementById('lrm-css-cdn')) {
      const link = document.createElement('link');
      link.id = 'lrm-css-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
      document.head.appendChild(link);
    }

    // Inject CDN script if not present
    if (!document.getElementById('lrm-js-cdn')) {
      const script = document.createElement('script');
      script.id = 'lrm-js-cdn';
      script.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js';
      script.async = true;
      script.onload = () => {
        if (window.L && window.L.Routing) {
          setIsReady(true);
        }
      };
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L && window.L.Routing && window.L.Routing.control) {
          setIsReady(true);
          clearInterval(interval);
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, []);

  return isReady;
};

// ============================================================================
// 3. ROUTING MACHINE LAYER (OSRM Road Routing Engine)
// ============================================================================

const RoutingMachineLayer = ({ waypoints, routeColor = '#2563eb', onRouteSummary }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const isLrmReady = useLeafletRoutingEngine();

  // Validate coordinates
  const validPoints = useMemo(() => {
    return (waypoints || []).filter(
      p => (p.latitude !== undefined || p.lat !== undefined) && 
           (p.longitude !== undefined || p.lng !== undefined)
    );
  }, [waypoints]);

  useEffect(() => {
    if (!map || !isLrmReady) return;

    // Need at least 2 points to generate road navigation
    if (validPoints.length < 2) {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {}
        routingControlRef.current = null;
      }
      return;
    }

    const lrmWaypoints = validPoints.map(p => 
      L.latLng(Number(p.latitude ?? p.lat), Number(p.longitude ?? p.lng))
    );

    // Clean up previous control
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {}
      routingControlRef.current = null;
    }

    try {
      const routingControl = L.Routing.control({
        waypoints: lrmWaypoints,
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        lineOptions: {
          styles: [
            { color: '#1e3a8a', opacity: 0.25, weight: 8 }, // Drop shadow / glow
            { color: routeColor, opacity: 0.95, weight: 5 }  // Brand Royal Blue
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 10
        },
        show: false, // Hide default clunky text container
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false, // Smooth bounds handled via MapAutoBoundsFitter
        createMarker: () => null // Prevent default blue markers so React-Leaflet markers render
      });

      // Extract telemetry from routesfound event
      routingControl.on('routesfound', (e) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const summary = routes[0].summary;
          const distanceKm = (summary.totalDistance / 1000).toFixed(1);
          const durationMins = Math.round(summary.totalTime / 60);

          if (onRouteSummary) {
            onRouteSummary({ distanceKm, durationMins });
          }
        }
      });

      routingControl.addTo(map);
      routingControlRef.current = routingControl;

    } catch (err) {
      console.error('Error initializing Leaflet Routing Machine:', err);
    }

    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          // Guard against unmounted map
        }
        routingControlRef.current = null;
      }
    };
  }, [map, validPoints, routeColor, isLrmReady, onRouteSummary]);

  // Fallback Polyline when LRM is loading or if network blocks OSRM
  if (!isLrmReady && validPoints.length >= 2) {
    const coords = validPoints.map(p => [Number(p.latitude ?? p.lat), Number(p.longitude ?? p.lng)]);
    return (
      <>
        <Polyline positions={coords} pathOptions={{ color: '#1e3a8a', weight: 8, opacity: 0.2 }} />
        <Polyline positions={coords} pathOptions={{ color: routeColor, weight: 4, dashArray: '6, 6', opacity: 0.9 }} />
      </>
    );
  }

  return null;
};

// ============================================================================
// 4. AUTO BOUNDS FITTER (Smooth Camera Transition)
// ============================================================================

const MapAutoBoundsFitter = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    try {
      const validPoints = points.filter(
        p => (p.latitude !== undefined || p.lat !== undefined) && 
             (p.longitude !== undefined || p.lng !== undefined)
      );

      if (validPoints.length === 1) {
        const p = validPoints[0];
        map.setView([Number(p.latitude ?? p.lat), Number(p.longitude ?? p.lng)], 13, {
          animate: true,
          duration: 0.6
        });
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(
          validPoints.map(p => [Number(p.latitude ?? p.lat), Number(p.longitude ?? p.lng)])
        );
        map.fitBounds(bounds, {
          padding: [70, 70],
          maxZoom: 14,
          animate: true,
          duration: 0.6
        });
      }
    } catch (err) {
      console.warn('Map bounds fitting notice:', err);
    }
  }, [points, map]);

  return null;
};

// ============================================================================
// 4b. FLY TO CONTROLLER (When user clicks "View on Map" in Timeline)
// ============================================================================

const MapFlyToController = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (target && target.latitude && target.longitude) {
      map.flyTo(
        [Number(target.latitude), Number(target.longitude)],
        target.zoom || 15,
        { duration: 1.0, animate: true }
      );
    }
  }, [target, map]);

  return null;
};

// ============================================================================
// 5. MAIN EXPORTED COMPONENT: TripMapVisualizer
// ============================================================================

/**
 * TripMapVisualizer
 * 
 * @param {Object} props
 * @param {Object} props.itinerary - AI generated smart plan object
 * @param {Array} props.waypoints - Optional raw waypoints array
 * @param {number|string} props.activeDay - 'all' or day number (1, 2, 3...)
 * @param {Function} props.onDayChange - Callback when user toggles day filter pills
 * @param {string} props.transportMode - Transport type ('Private Van' | 'Tuk-Tuk' | 'Scenic Train' | 'Walking')
 * @param {Function} props.onRouteTelemetry - Callback receiving { distanceKm, durationMins }
 * @param {Function} props.onSwapItem - Callback when user clicks 'Swap' in a marker popup
 * @param {Function} props.onRemoveItem - Callback when user clicks 'Remove' in a marker popup
 * @param {string} props.height - Map container height string
 */
export default function TripMapVisualizer({
  itinerary,
  waypoints: rawWaypoints,
  activeDay = 'all',
  onDayChange,
  transportMode = 'Private Van',
  onRouteTelemetry,
  onSwapItem,
  onRemoveItem,
  focusLocation = null,
  height = '100%',
  className = ''
}) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Standard free OpenStreetMap tile layer (no API key required)
  const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const [telemetry, setTelemetry] = useState(null);

  // Determine available days for filter pills
  const availableDays = useMemo(() => {
    if (!itinerary || !Array.isArray(itinerary.days)) return [1];
    return itinerary.days.map(d => d.dayNumber);
  }, [itinerary]);

  // Extract waypoints filtered by the active day
  const filteredWaypoints = useMemo(() => {
    if (Array.isArray(rawWaypoints) && rawWaypoints.length > 0) {
      return rawWaypoints;
    }

    if (!itinerary) return [];
    const list = [];

    // 1. Hotel Stay Base
    const hotel = itinerary.recommendedHotel;
    if (hotel?.latitude && hotel?.longitude) {
      list.push({
        type: 'hotel',
        reference_id: hotel.id,
        name: hotel.name,
        latitude: Number(hotel.latitude),
        longitude: Number(hotel.longitude),
        costUSD: hotel.pricePerNightUSD || hotel.costUSD,
        pricePerNightUSD: hotel.pricePerNightUSD || hotel.costUSD,
        rating: hotel.rating,
        image_url: hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
        dayNumber: 1
      });
    }

    // 2. Attractions across days
    if (Array.isArray(itinerary.days)) {
      itinerary.days.forEach(day => {
        // Filter by activeDay if not 'all'
        if (activeDay !== 'all' && day.dayNumber !== activeDay) return;

        if (Array.isArray(day.items)) {
          day.items.forEach((item, idx) => {
            if (item.type === 'place' && item.latitude && item.longitude) {
              list.push({
                ...item,
                dayNumber: day.dayNumber,
                sequenceNumber: idx + 1
              });
            }
          });
        }
      });
    }

    return list;
  }, [itinerary, rawWaypoints, activeDay]);

  // Center coordinate fallback (Centroid of Sri Lanka)
  const mapCenter = useMemo(() => {
    if (filteredWaypoints.length > 0) {
      const first = filteredWaypoints[0];
      return [Number(first.latitude), Number(first.longitude)];
    }
    return [7.8731, 80.7718];
  }, [filteredWaypoints]);

  // Handle telemetry updates and notify parent
  const handleTelemetryCalculated = (summary) => {
    setTelemetry(summary);
    if (onRouteTelemetry) {
      onRouteTelemetry(summary);
    }
  };

  // Get transport icon
  const TransportIcon = useMemo(() => {
    const mode = (transportMode || '').toLowerCase();
    if (mode.includes('train')) return Train;
    if (mode.includes('tuktuk') || mode.includes('tuk-tuk')) return Bike;
    if (mode.includes('walk')) return Footprints;
    return Car;
  }, [transportMode]);

  return (
    <div className={`trip-map-wrapper ${className}`} style={{ height }}>
      
      {/* ==================================================================== */}
      {/* 1. FLOATING GLASS CONTROL: DAY FILTER PILLS (Top Center) */}
      {/* ==================================================================== */}
      {availableDays.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] backdrop-blur-md bg-white/85 dark:bg-slate-900/85 shadow-lg rounded-2xl border border-slate-200/60 dark:border-slate-800 p-1.5 flex items-center gap-1.5 transition">
          <button
            type="button"
            onClick={() => onDayChange && onDayChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
              activeDay === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Days
          </button>
          {availableDays.map(dNum => (
            <button
              key={dNum}
              type="button"
              onClick={() => onDayChange && onDayChange(dNum)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                activeDay === dNum
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Day {dNum}
            </button>
          ))}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. LEAFLET MAP CANVAS */}
      {/* ==================================================================== */}
      <MapContainer
        center={mapCenter}
        zoom={10}
        minZoom={6}
        zoomControl={false}
        className="trip-map-canvas w-full h-full"
      >
        <TileLayer
          url={tileLayerUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Dynamic Bounds Auto-Fitter */}
        <MapAutoBoundsFitter points={filteredWaypoints} />

        {/* Smooth Map Pan/Zoom to focused location when user clicks "View on Map" */}
        <MapFlyToController target={focusLocation} />

        {/* Turn-by-Turn Road Routing Machine Engine */}
        <RoutingMachineLayer
          waypoints={filteredWaypoints}
          routeColor="#2563eb"
          onRouteSummary={handleTelemetryCalculated}
        />

        {/* Custom React-Leaflet Markers & Glassmorphic Popups */}
        {filteredWaypoints.map((wp, i) => {
          const isHotel = wp.type === 'hotel';
          const icon = isHotel
            ? createHotelDivIcon(wp.pricePerNightUSD)
            : createPlaceDivIcon(wp.sequenceNumber || i, wp.category);

          return (
            <Marker
              key={`${wp.type}-${wp.reference_id || i}`}
              position={[Number(wp.latitude), Number(wp.longitude)]}
              icon={icon}
            >
              <Popup className="glassmorphic-leaflet-popup">
                <div className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-800 dark:text-slate-100 max-w-[270px]">
                  
                  {/* Thumbnail Image */}
                  {wp.image_url && (
                    <div className="relative h-28 w-full overflow-hidden">
                      <img 
                        src={wp.image_url} 
                        alt={wp.name}
                        className="w-full h-full object-cover" 
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-slate-950/70 text-white backdrop-blur-md">
                        {isHotel ? 'Hotel Stay' : wp.category || 'Attraction'}
                      </span>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-3.5 space-y-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                        {wp.name}
                      </h4>
                      {wp.timeSlot && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Clock size={11} /> {wp.timeSlot}
                        </div>
                      )}
                    </div>

                    {/* Cost & Rating */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {isHotel 
                          ? `$${wp.pricePerNightUSD}/night` 
                          : wp.costUSD > 0 ? `$${wp.costUSD} USD` : 'Free Entry'}
                      </span>
                      {wp.rating && (
                        <span className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                          <Star size={12} className="fill-amber-500" />
                          <span>{wp.rating}</span>
                        </span>
                      )}
                    </div>

                    {/* Quick Action Buttons (Swap & Remove) */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSwapItem) onSwapItem(wp);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        <span>Swap</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onRemoveItem) onRemoveItem(wp);
                        }}
                        className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition flex items-center justify-center cursor-pointer"
                        title="Remove from Itinerary"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ==================================================================== */}
      {/* 3. FLOATING GLASS CONTROL: LIVE ROUTE TELEMETRY BADGE (Bottom Center) */}
      {/* ==================================================================== */}
      {telemetry && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] backdrop-blur-md bg-slate-900/90 dark:bg-slate-950/90 text-white shadow-xl rounded-2xl border border-white/10 px-4 py-2.5 flex items-center gap-4 transition select-none">
          <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
            <TransportIcon size={15} />
            <span>{transportMode}</span>
          </div>

          <div className="w-px h-3.5 bg-white/20" />

          <div className="flex items-center gap-1 text-slate-200 text-xs font-semibold">
            <Navigation size={13} className="text-emerald-400" />
            <span>{telemetry.distanceKm} km</span>
          </div>

          <div className="w-px h-3.5 bg-white/20" />

          <div className="flex items-center gap-1 text-amber-300 text-xs font-semibold">
            <Clock size={13} />
            <span>~{telemetry.durationMins} mins</span>
          </div>
        </div>
      )}

    </div>
  );
}
