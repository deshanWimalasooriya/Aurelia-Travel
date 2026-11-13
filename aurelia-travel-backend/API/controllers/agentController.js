/**
 * Bridge between Aurelia and the Python "travel-Agent-2.0" service (CrewAI + FastAPI).
 *
 *   React ──► /api/smart-plan/agent/start   ──► AGENT_URL/design-trip/async
 *   React ──► /api/smart-plan/agent/status  ──► AGENT_URL/design-trip/status/{id}
 *   Agent ──► /api/hotels/availability      (grounds the agent in real Aurelia inventory)
 *
 * The agent returns 3 route options in its own shape; adaptRoute() converts each
 * one into the itinerary shape TravelPlanPage already renders (days[].items[]).
 */
const axios = require('axios');
const db = require('../../config/db');

const AGENT_TIMEOUT_MS = 15000;
const LKR_PER_USD = 300; // rough conversion when the agent quotes LKR prices

// jobId -> { userId, request, adapted } ; in-memory like the agent's own job store
const jobs = new Map();
const geocodeCache = new Map();

const agentClient = () => axios.create({
  baseURL: process.env.AGENT_URL || 'http://localhost:8000',
  timeout: AGENT_TIMEOUT_MS,
  headers: process.env.AGENT_API_KEY ? { 'X-Agent-Key': process.env.AGENT_API_KEY } : {},
});

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
const parseGroupSize = (group) => {
  if (typeof group === 'number') return Math.max(1, group);
  const nums = String(group || '').match(/\d+/g);
  return nums ? Math.max(1, nums.reduce((s, n) => s + Number(n), 0)) : 2;
};

const parseDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const addDays = (isoDate, n) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const parsePriceUSD = (text) => {
  if (!text) return 0;
  const match = String(text).replace(/,/g, '').match(/\d+(\.\d+)?/);
  if (!match) return 0;
  const value = Number(match[0]);
  return /lkr|rs\.?|rupee/i.test(text) ? Math.round(value / LKR_PER_USD) : Math.round(value);
};

const arrivalTown = (segment = '') => {
  const parts = segment.replace(/->|→|–|—/g, ' to ').split(/\s+to\s+/i);
  return parts[parts.length - 1].trim();
};

// Keyless geocoder (same one the Python agent uses), cached per town.
const geocode = async (town) => {
  const key = town.toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  let coords = null;
  try {
    const { data } = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: town, count: 1, countryCode: 'LK' },
      timeout: 8000,
    });
    const hit = data?.results?.[0];
    if (hit) coords = { latitude: hit.latitude, longitude: hit.longitude, name: hit.name };
  } catch (err) {
    console.warn(`Geocode failed for ${town}:`, err.message);
  }
  geocodeCache.set(key, coords);
  return coords;
};

// Coordinates -> nearest town name (OpenStreetMap Nominatim, keyless; ~1 req/s policy).
const reverseGeocodeCache = new Map();
const reverseGeocode = async (lat, lng) => {
  const key = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
  if (reverseGeocodeCache.has(key)) return reverseGeocodeCache.get(key);
  const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: { lat, lon: lng, format: 'jsonv2', zoom: 12, 'accept-language': 'en' },
    headers: { 'User-Agent': 'AureliaTravel/1.0 (trip planner)' },
    timeout: 8000,
  });
  const a = data?.address || {};
  const town = a.city || a.town || a.village || a.suburb || a.county || a.state_district || a.state || null;
  const result = town ? town.replace(/ (Municipal Council|Urban Council|Divisional Secretariat)$/i, '') : null;
  reverseGeocodeCache.set(key, result);
  return result;
};

// Try to link an agent-recommended hotel to a real Aurelia hotel by name.
const findAureliaHotel = async (name) => {
  if (!name) return null;
  const cleaned = name.replace(/\(.*?\)/g, '').trim().toLowerCase();
  if (cleaned.length < 3) return null;
  return db('hotels')
    .select('id', 'name', 'city', 'latitude', 'longitude', 'main_image')
    .where('is_active', true)
    .andWhereRaw('LOWER(name) LIKE ?', [`%${cleaned}%`])
    .first();
};

// ----------------------------------------------------------------------------
// Activity -> real map location (Photon / OpenStreetMap, keyless)
// ----------------------------------------------------------------------------
const SRI_LANKA_BBOX = '79.5,5.8,82.0,9.9';
const placeCache = new Map();

const distanceKm = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

// "Explore Kandy Lake and Temple of the Tooth" -> ["Kandy Lake and Temple of the Tooth", "Kandy Lake"]
const placeQueries = (activity) => {
  const cleaned = String(activity)
    .replace(/\(.*?\)/g, '')
    .replace(/^(visit|explore|see|tour|hike( up| to)?|climb|walk( around| along)?|take a|enjoy( a| the)?|relax( at| on)?|go to|discover|stroll( through| along)?|experience|watch|spend time at)\s+/i, '')
    .replace(/^the\s+/i, '')
    .trim();
  const first = cleaned.split(/\s+(?:and|&|,|followed by|then)\s+/i)[0].trim();
  return [...new Set([cleaned, first].filter((q) => q.length >= 3))];
};

const guessCategory = (text) => {
  const t = text.toLowerCase();
  if (/temple|kovil|church|mosque|dagoba|stupa|vihara|devale|festival|dance|market|village/.test(t)) return 'Culture';
  if (/fort|museum|ruin|ancient|palace|historic|colonial|heritage|rock fortress/.test(t)) return 'History';
  if (/hike|trek|climb|rafting|surf|zipline|safari|kayak|dive|snorkel|peak|cycling/.test(t)) return 'Adventure';
  if (/beach|spa|pool|sunset|relax|lagoon|cruise|tea/.test(t)) return 'Relaxation';
  if (/park|falls|waterfall|lake|garden|forest|wildlife|bird|whale|elephant|nature|botanical/.test(t)) return 'Nature';
  return 'Sight';
};

// Find an activity's coordinates near the day's towns; null if nothing plausible.
const locateActivity = async (activity, anchors = []) => {
  const valid = anchors.filter(Boolean);
  const nearCoords = valid[0] || null;
  const key = `${activity}|${valid.map((c) => `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`).join(';')}`;
  if (placeCache.has(key)) return placeCache.get(key);

  let found = null;
  let hadError = false;
  const isNearby = (hit) => !valid.length || valid.some((c) => distanceKm(hit, c) <= 60);

  for (const q of placeQueries(activity)) {
    const result = await searchPlace(q, nearCoords);
    if (result.error) { hadError = true; continue; }
    // Reject matches far from where the day happens (e.g. a same-named place across the island)
    const hit = result.hits.find(isNearby);
    if (hit) { found = hit; break; }
  }
  // Only remember real answers; a temporary outage must not stick as "not found"
  if (found || !hadError) placeCache.set(key, found);
  return found;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isBusy = (err) => [429, 502, 503, 504].includes(err.response?.status) || err.code === 'ECONNABORTED';

// Photon (fast) with retry; falls back to Nominatim (max 1 request/second by policy)
let nominatimChain = Promise.resolve();
const nominatimSearch = (q, near) => {
  const run = nominatimChain.then(async () => {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q, format: 'jsonv2', limit: 3, countrycodes: 'lk', addressdetails: 1, 'accept-language': 'en',
        ...(near ? { viewbox: `${near.longitude - 0.6},${near.latitude + 0.6},${near.longitude + 0.6},${near.latitude - 0.6}` } : {}),
      },
      headers: { 'User-Agent': 'AureliaTravel/1.0 (trip planner)' },
      timeout: 8000,
    });
    return (data || []).map((r) => ({
      latitude: Number(r.lat),
      longitude: Number(r.lon),
      locality: r.address?.city || r.address?.town || r.address?.village || r.address?.county || '',
    }));
  });
  nominatimChain = run.catch(() => {}).then(() => sleep(1100));
  return run;
};

// Circuit breaker: when Photon is overloaded, skip it for a minute instead of retrying every query
let photonPausedUntil = 0;

const searchPlace = async (q, near) => {
  for (let attempt = 0; attempt < 2 && Date.now() >= photonPausedUntil; attempt++) {
    try {
      const { data } = await axios.get('https://photon.komoot.io/api/', {
        params: { q, limit: 3, bbox: SRI_LANKA_BBOX, ...(near ? { lat: near.latitude, lon: near.longitude } : {}) },
        timeout: 8000,
      });
      const hits = (data?.features || []).map((f) => {
        const p = f.properties || {};
        return {
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
          locality: p.city || p.town || p.village || p.county || p.state || '',
        };
      });
      return { hits };
    } catch (err) {
      if (!isBusy(err)) break;
      if (attempt === 1) { photonPausedUntil = Date.now() + 60000; break; }
      await sleep(500);
    }
  }
  try {
    return { hits: await nominatimSearch(q, near) };
  } catch (err) {
    console.warn(`Place lookup failed for "${q}":`, err.message);
    return { hits: [], error: true };
  }
};

// Run async jobs with limited concurrency (be polite to free geocoders)
const mapLimit = async (items, limit, fn) => {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
};

// ----------------------------------------------------------------------------
// Adapter: agent RouteOption -> Aurelia itinerary
// ----------------------------------------------------------------------------
const departureTown = (segment = '') => segment.replace(/->|→|–|—/g, ' to ').split(/\s+to\s+/i)[0].trim();

const adaptRoute = async (route, request, tripSummary) => {
  let totalCost = 0;
  let recommendedHotel = null;
  const startCoords = await geocode(request.startLocation);
  const breakdown = route.daily_breakdown || [];

  // Resolve each day's towns + hotel first (sequential days, parallel lookups)
  const dayBases = await Promise.all(breakdown.map(async (day, i) => {
    const toTown = arrivalTown(day.route_segment);
    const fromTown = departureTown(day.route_segment) || (i === 0 ? request.startLocation : '');
    const [dbHotel, toCoords, fromCoords] = await Promise.all([
      findAureliaHotel(day.hotel_name), geocode(toTown), fromTown ? geocode(fromTown) : null,
    ]);
    return { day, i, toTown, fromTown, dbHotel, toCoords, fromCoords };
  }));

  // Locate all activities (3 at a time)
  const activityJobs = dayBases.flatMap(({ day, i, toCoords, fromCoords }) =>
    (day.activities || []).map((activity) => ({ dayIdx: i, activity, anchors: [toCoords, fromCoords] })));
  const located = await mapLimit(activityJobs, 2, (job) => locateActivity(job.activity, job.anchors));

  const slots = ['09:00 AM - 11:30 AM', '12:00 PM - 02:30 PM', '03:00 PM - 05:30 PM', '06:00 PM - 07:30 PM'];
  let jobIndex = 0;

  const days = dayBases.map(({ day, i, toTown, fromTown, dbHotel, toCoords }) => {
    const costUSD = parsePriceUSD(day.hotel_price);
    totalCost += costUSD;

    const activityItems = (day.activities || []).map((activity, n) => {
      const loc = located[jobIndex++];
      return {
        type: 'place',
        reference_id: null,
        name: activity,
        category: guessCategory(activity),
        latitude: loc?.latitude ?? null,
        longitude: loc?.longitude ?? null,
        timeSlot: slots[n] || 'Flexible',
        durationMins: 150,
        costUSD: 0,
        notes: loc?.locality ? `Near ${loc.locality}` : '',
        image_url: null,
      };
    });

    const hotelItem = {
      type: 'hotel',
      category: 'Stay',
      reference_id: dbHotel?.id ?? null,
      name: dbHotel?.name || day.hotel_name,
      latitude: dbHotel?.latitude != null ? Number(dbHotel.latitude) : toCoords?.latitude ?? null,
      longitude: dbHotel?.longitude != null ? Number(dbHotel.longitude) : toCoords?.longitude ?? null,
      timeSlot: 'Check-in from 2:00 PM',
      durationMins: 0,
      costUSD,
      pricePerNightUSD: costUSD,
      roomConfiguration: day.room_configuration || '',
      notes: [day.room_configuration, dbHotel ? 'Bookable on Aurelia' : 'Found online'].filter(Boolean).join(' · '),
      image_url: dbHotel?.main_image || null,
      bookable: Boolean(dbHotel),
    };
    if (dbHotel && !recommendedHotel) recommendedHotel = hotelItem;

    return {
      dayNumber: day.day_number || i + 1,
      date: request.startDate ? addDays(request.startDate, i) : null,
      fromTown,
      toTown,
      theme: fromTown && toTown && fromTown !== toTown ? `${fromTown} → ${toTown}` : (toTown || day.route_segment),
      weather: day.weather || '',
      items: [...activityItems, hotelItem],
    };
  });

  const guests = Number(request.guests) || 0;
  return {
    source: 'travel-agent-2.0',
    tripTitle: route.path_name,
    startLocation: request.startLocation,
    startCoords: startCoords ? { latitude: startCoords.latitude, longitude: startCoords.longitude } : null,
    startDate: request.startDate,
    destinationCity: request.destinationCity,
    durationDays: request.durationDays,
    budgetUSD: request.budgetUSD,
    vibe: request.vibe,
    transportMode: request.transportMode,
    guests,
    rooms: request.rooms,
    whyItFits: route.why_it_fits,
    googleMapsUrl: route.full_google_maps_url,
    summary: {
      totalEstimatedCost: totalCost,
      totalDistanceKm: null,
      transportBreakdown: route.why_it_fits || tripSummary,
    },
    recommendedHotel,
    days,
  };
};

// ----------------------------------------------------------------------------
// GET /api/hotels/availability?town=&checkIn=&group=   (called BY the agent)
// ----------------------------------------------------------------------------
exports.hotelAvailability = async (req, res) => {
  try {
    const { town, checkIn, group } = req.query;
    if (!town) return res.status(400).json({ success: false, message: 'town is required' });

    const guests = parseGroupSize(group);
    const checkInDate = parseDate(checkIn);

    const rows = await db('rooms as r')
      .join('hotels as h', 'h.id', 'r.hotel_id')
      .select(
        'h.id as hotel_id', 'h.name', 'h.city', 'h.rating_average',
        'r.id as room_id', 'r.title', 'r.room_type', 'r.capacity',
        'r.base_price_per_night', 'r.total_quantity'
      )
      .where('h.is_active', true)
      .andWhere('r.is_active', true)
      .andWhere((qb) => {
        qb.whereRaw('LOWER(h.city) LIKE ?', [`%${town.toLowerCase()}%`])
          .orWhereRaw('LOWER(h.address_line_1) LIKE ?', [`%${town.toLowerCase()}%`]);
      });

    // Subtract rooms already booked for that night.
    let bookedByRoom = {};
    if (checkInDate && rows.length) {
      const booked = await db('bookings')
        .select('room_id')
        .sum({ booked: 'room_count' })
        .whereIn('room_id', rows.map((r) => r.room_id))
        .whereNotIn('status', ['cancelled', 'refunded'])
        .andWhere('check_in', '<=', checkInDate)
        .andWhere('check_out', '>', checkInDate)
        .groupBy('room_id');
      bookedByRoom = Object.fromEntries(booked.map((b) => [b.room_id, Number(b.booked)]));
    }

    // Pick the cheapest workable room setup per hotel.
    const byHotel = new Map();
    for (const r of rows) {
      const free = (r.total_quantity || 1) - (bookedByRoom[r.room_id] || 0);
      if (free <= 0) continue;
      const capacity = r.capacity || 2;
      const roomsNeeded = Math.ceil(guests / capacity);
      if (roomsNeeded > free) continue;
      const total = roomsNeeded * Number(r.base_price_per_night);
      const current = byHotel.get(r.hotel_id);
      if (!current || total < current.total) {
        byHotel.set(r.hotel_id, { r, roomsNeeded, total });
      }
    }

    const hotels = [...byHotel.values()]
      .sort((a, b) => a.total - b.total)
      .slice(0, 5)
      .map(({ r, roomsNeeded, total }) => ({
        id: r.hotel_id,
        name: r.name,
        city: r.city,
        rating: Number(r.rating_average) || null,
        roomConfiguration: `${roomsNeeded} x ${r.title} (${r.room_type})`,
        pricePerNight: `${process.env.HOTEL_PRICE_CURRENCY || 'USD'} ${total.toFixed(0)} total for ${guests} guest(s)`,
        capacityNote: `${roomsNeeded * (r.capacity || 2)} beds for ${guests} guest(s)`,
      }));

    res.json({ success: true, town, checkIn: checkInDate, guests, hotels });
  } catch (err) {
    console.error('hotelAvailability error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------------------------------------------------------------
// GET /api/smart-plan/reverse-geocode?lat=&lng=   (GPS / map pin -> town name)
// ----------------------------------------------------------------------------
exports.reverseGeocodeHandler = async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ success: false, message: 'lat and lng are required numbers' });
  }
  try {
    const town = await reverseGeocode(lat, lng);
    if (!town) return res.status(404).json({ success: false, message: 'No town found at that location' });
    res.json({ success: true, town });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Location lookup failed' });
  }
};

// ----------------------------------------------------------------------------
// GET /api/smart-plan/geocode?q=Jaffna   (typed town -> map pin)
// ----------------------------------------------------------------------------
exports.geocodeHandler = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.status(400).json({ success: false, message: 'q is required' });
  const hit = await geocode(q.slice(0, 80));
  if (!hit) return res.status(404).json({ success: false, message: 'Town not found in Sri Lanka' });
  res.json({ success: true, town: hit.name, lat: hit.latitude, lng: hit.longitude });
};

const cleanText = (value, max = 500) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

// "Custom GPS (6.9271, 79.8612)" -> reverse-geocoded town; otherwise strip "(...)" notes.
const resolvePlace = async (text, coords) => {
  const raw = String(text || '');
  const match = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  const lat = coords?.lat ?? (match && Number(match[1]));
  const lng = coords?.lng ?? (match && Number(match[2]));
  if (match || coords) {
    try {
      const town = await reverseGeocode(lat, lng);
      if (town) return town;
    } catch (err) {
      console.warn('Reverse geocode failed:', err.message);
    }
  }
  return raw.split('(')[0].trim() || raw.trim();
};

const describeTravelers = (adults, children, guests) => {
  const a = Number(adults);
  const c = Number(children) || 0;
  if (!a && !c) return `${guests} ${Number(guests) === 1 ? 'adult' : 'adults'}`;
  const parts = [`${a || 1} ${a === 1 ? 'adult' : 'adults'}`];
  if (c > 0) parts.push(`${c} ${c === 1 ? 'child' : 'children'}`);
  return parts.join(', ');
};

// ----------------------------------------------------------------------------
// POST /api/smart-plan/agent/start
// ----------------------------------------------------------------------------
exports.startAgentTrip = async (req, res) => {
  try {
    const {
      startLocation = 'Colombo', destinationCity, durationDays = 2, budgetUSD = 150,
      vibe = 'Relaxing', transportMode = 'Private Van', startDate, endDate, tripDescription,
      weatherPreference, amenities, startCoords, destinationCoords, ownTransport,
    } = req.body;
    const rooms = Math.max(0, Math.min(20, Number(req.body.rooms) || 0));
    const adults = Number(req.body.adults) || 0;
    const children = Number(req.body.children) || 0;
    const guests = adults + children || Number(req.body.guests) || 2;

    if (!destinationCity && !destinationCoords) {
      return res.status(400).json({ success: false, message: 'destinationCity is required' });
    }

    const start = parseDate(startDate) || addDays(new Date().toISOString().slice(0, 10), 1);
    const end = parseDate(endDate);
    // Dec 20 -> Dec 22 = 3 travel days (2 nights)
    const daysFromDates = end ? Math.round((new Date(end) - new Date(start)) / 86400000) + 1 : 0;
    const days = Math.max(1, Math.min(14, daysFromDates > 0 ? daysFromDates : Number(durationDays) || 2));
    const perNight = Math.max(1, Math.round(Number(budgetUSD) / days));
    const [startPlace, endPlace] = await Promise.all([
      resolvePlace(startLocation, startCoords),
      resolvePlace(destinationCity, destinationCoords),
    ]);

    const agentRequest = {
      start_place: startPlace,
      end_place: endPlace,
      start_date: start,
      duration: days,
      travelers: describeTravelers(adults, children, guests),
      vibe,
      budget: `$${perNight} total per night`,
      transport: ownTransport
        ? 'own vehicle (self-drive) — no transport booking needed'
        : `needs transport arranged: ${transportMode}`,
      rooms,
      trip_description: cleanText(tripDescription)
        || `A ${String(vibe).toLowerCase()} ${days}-day trip from ${startPlace} to ${endPlace}.`,
      weather_preference: cleanText(weatherPreference, 200),
      amenities: Array.isArray(amenities) ? amenities.map((a) => cleanText(a, 40)).filter(Boolean).slice(0, 10) : [],
    };

    const { data } = await agentClient().post('/design-trip/async', agentRequest);

    jobs.set(data.job_id, {
      userId: req.user?.userId ?? req.user?.id,
      request: {
        startLocation: startPlace, destinationCity: endPlace, durationDays: days, budgetUSD, vibe,
        transportMode: ownTransport ? 'Own Vehicle' : transportMode, guests, rooms, startDate: start,
      },
      adapted: null,
    });

    res.status(202).json({ success: true, jobId: data.job_id });
  } catch (err) {
    console.error('startAgentTrip error:', err.message);
    res.status(502).json({ success: false, message: 'Trip agent is unavailable. Please try again later.' });
  }
};

// ----------------------------------------------------------------------------
// GET /api/smart-plan/agent/status/:jobId
// ----------------------------------------------------------------------------
exports.agentTripStatus = async (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  const userId = req.user?.userId ?? req.user?.id;

  if (!job || job.userId !== userId) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  if (job.adapted) {
    return res.json({ success: true, status: 'done', stage: 'done', progress: 100, ...job.adapted });
  }

  try {
    const { data } = await agentClient().get(`/design-trip/status/${jobId}`);

    if (data.status === 'error') {
      jobs.delete(jobId);
      return res.json({ success: false, status: 'error', message: data.error || 'Generation failed.' });
    }

    if (data.status !== 'done') {
      return res.json({ success: true, status: data.status, stage: data.stage, progress: data.progress, detail: data.detail });
    }

    // Convert once, even if several status polls arrive while place lookups run.
    // Routes go one at a time to stay polite to the free geocoding services.
    if (!job.adapting) {
      job.adapting = (async () => {
        const routes = [];
        for (const r of data.result?.routes || []) {
          routes.push(await adaptRoute(r, job.request, data.result.trip_summary));
        }
        return { itinerary: routes[0], routeOptions: routes };
      })();
      job.adapting.catch(() => { job.adapting = null; });
    }
    job.adapted = await job.adapting;
    // Free memory after the browser has had time to fetch the result.
    setTimeout(() => jobs.delete(jobId), 30 * 60 * 1000).unref();

    res.json({ success: true, status: 'done', stage: 'done', progress: 100, ...job.adapted });
  } catch (err) {
    const code = err.response?.status === 404 ? 404 : 502;
    if (code === 404) jobs.delete(jobId);
    res.status(code).json({
      success: false,
      status: 'error',
      message: code === 404 ? 'The agent lost this job (it may have restarted).' : 'Trip agent is unavailable.',
    });
  }
};

// Exported for tests
exports._internal = { adaptRoute, parsePriceUSD, parseGroupSize, arrivalTown };
