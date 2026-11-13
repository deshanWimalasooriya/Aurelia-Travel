import React, { useState, useMemo } from 'react';
import { 
  Reorder, motion, AnimatePresence 
} from 'framer-motion';
import { 
  GripVertical, MapPin, RefreshCw, Trash2, Clock, 
  DollarSign, Star, Sparkles, PlusCircle, RotateCcw, 
  BedDouble, Camera, Navigation, Car, Bike, Train, Footprints, 
  Wallet, ArrowLeft, Download, Check, Search, Filter, X, Save, Share2,
  CloudSun, BadgeCheck
} from 'lucide-react';
import Button from '../common/Button';
import { useCurrency } from '../../context/currencyCore';

// "2026-12-20" -> "Sat, 20 Dec" (date-only strings are parsed as UTC, so format in UTC)
const formatDayDate = (iso) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
};

// Straight-line km between two stops (a hint, not a road distance)
const kmBetween = (a, b) => {
  const ok = (p) => p && Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)) && p.latitude !== null;
  if (!ok(a) || !ok(b)) return null;
  const toRad = (x) => (Number(x) * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};
import './styles/ItineraryEditor.css';

// ============================================================================
// CURATED CATALOG OF SRI LANKAN ATTRACTIONS (For "Add Stop" Drawer)
// ============================================================================
const ADDABLE_PLACES_CATALOG = [
  {
    reference_id: 1001,
    id: 1001,
    name: "Bahirawakanda Vihara Buddha Statue",
    city: "Kandy",
    category: "Culture",
    latitude: 7.2917,
    longitude: 80.6300,
    costUSD: 3,
    durationMins: 60,
    rating: 4.8,
    image_url: "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=600&q=80",
    notes: "Towering 88-foot white Buddha statue offering 360-degree views of Kandy valley."
  },
  {
    reference_id: 1002,
    id: 1002,
    name: "Udawatta Kele Royal Forest Reserve",
    city: "Kandy",
    category: "Nature",
    latitude: 7.2980,
    longitude: 80.6420,
    costUSD: 5,
    durationMins: 90,
    rating: 4.7,
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    notes: "Historic kingdom sanctuary with lush forest walks and rare birdwatching."
  },
  {
    reference_id: 1003,
    id: 1003,
    name: "Ceylon Tea Museum, Hantana",
    city: "Kandy",
    category: "History",
    latitude: 7.2625,
    longitude: 80.6250,
    costUSD: 6,
    durationMins: 90,
    rating: 4.6,
    image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80",
    notes: "1925 vintage factory demonstrating traditional tea rolling and cupping."
  },
  {
    reference_id: 1004,
    id: 1004,
    name: "Diyaluma Waterfall Upper Pools",
    city: "Ella",
    category: "Adventure",
    latitude: 6.7327,
    longitude: 81.0315,
    costUSD: 0,
    durationMins: 150,
    rating: 4.9,
    image_url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80",
    notes: "Stunning series of natural rock infinity pools high above the Ella valley."
  },
  {
    reference_id: 1005,
    id: 1005,
    name: "Ravana Pool Club & Ella Swing",
    city: "Ella",
    category: "Relaxation",
    latitude: 6.8580,
    longitude: 81.0490,
    costUSD: 12,
    durationMins: 120,
    rating: 4.7,
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    notes: "Tropical hilltop day club with heated infinity pool overlooking Little Adam's Peak."
  },
  {
    reference_id: 1006,
    id: 1006,
    name: "Galle Dutch Fort Ramparts",
    city: "Galle",
    category: "History",
    latitude: 6.0268,
    longitude: 80.2170,
    costUSD: 0,
    durationMins: 120,
    rating: 4.9,
    image_url: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80",
    notes: "17th-century oceanfront UNESCO bastion filled with boutique cafes and lighthouses."
  },
  {
    reference_id: 1007,
    id: 1007,
    name: "Sigiriya Lion Rock Fortress",
    city: "Sigiriya",
    category: "Culture",
    latitude: 7.9570,
    longitude: 80.7603,
    costUSD: 30,
    durationMins: 180,
    rating: 4.9,
    image_url: "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=600&q=80",
    notes: "Ancient 5th-century sky palace carved into a sheer 200-meter monolith."
  },
  {
    reference_id: 1008,
    id: 1008,
    name: "Mirissa Coconut Tree Hill",
    city: "Mirissa",
    category: "Relaxation",
    latitude: 5.9450,
    longitude: 80.4610,
    costUSD: 0,
    durationMins: 60,
    rating: 4.8,
    image_url: "https://images.unsplash.com/photo-1546768292-fb12f6c92568?auto=format&fit=crop&w=600&q=80",
    notes: "Iconic ocean promontory lined with towering palm trees overlooking the Indian Ocean."
  }
];

// Category color mappings
const CATEGORY_STYLES = {
  nature: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  history: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  culture: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  adventure: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  relaxation: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
};

/**
 * ItineraryEditor Component
 * 
 * Main 55% split-screen editor equipped with native framer-motion Reorder drag-and-drop,
 * sticky budget health progress bar, category tags, travel connector lines, and stop drawer.
 */
export default function ItineraryEditor({
  itinerary,
  activeDay = 'all',
  onDayChange,
  routeTelemetry,
  onReorderItems,
  onSwapItem,
  onRemoveItem,
  onAddStop,
  onFocusLocation,
  onUndo,
  canUndo = false,
  undoCount = 0,
  onDownload,
  onConfirmPlan,
  onNavigateBack,
  onSaveTrip,
  isSaving = false,
  onShareTrip,
  onBookHotels,
  isSaved = false
}) {
  // Add Stop Drawer State: which day is currently opening the drawer
  const [addingStopForDay, setAddingStopForDay] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // ==========================================================================
  // FINANCIAL CALCULATIONS & BUDGET HEALTH
  // ==========================================================================
  const { format } = useCurrency();
  const targetBudget = Number(itinerary?.budgetUSD || 250);

  // AI-agent plans carry one hotel item per night inside each day
  const hasNightlyHotels = useMemo(
    () => (itinerary?.days || []).some(d => (d.items || []).some(it => it.type === 'hotel')),
    [itinerary]
  );

  // 1. Accommodation total
  const accommodationTotal = useMemo(() => {
    if (hasNightlyHotels) {
      return (itinerary.days || []).reduce((sum, d) =>
        sum + (d.items || []).filter(it => it.type === 'hotel').reduce((s, it) => s + Number(it.costUSD || 0), 0), 0);
    }
    if (!itinerary?.recommendedHotel) return 0;
    const price = itinerary.recommendedHotel.pricePerNightUSD || itinerary.recommendedHotel.costUSD || 0;
    const nights = Math.max(1, (itinerary.durationDays || 2) - 1);
    return Number(price) * nights;
  }, [itinerary, hasNightlyHotels]);

  // 2. Activities total (hotels are counted under Stays)
  const activitiesTotal = useMemo(() => {
    let sum = 0;
    (itinerary?.days || []).forEach(day => {
      (day.items || []).forEach(item => {
        if (item.type !== 'hotel') sum += Number(item.costUSD || 0);
      });
    });
    return sum;
  }, [itinerary]);

  // 3. Transport estimate based on transport mode & telemetry distance
  const transportEstimate = useMemo(() => {
    const mode = (itinerary?.transportMode || 'Private Van').toLowerCase();
    const distanceKm = Number(routeTelemetry?.distanceKm || itinerary?.summary?.totalDistanceKm || 120);
    
    let ratePerKm = 0.45; // Default Van
    if (mode.includes('tuktuk') || mode.includes('tuk-tuk')) ratePerKm = 0.25;
    if (mode.includes('train')) ratePerKm = 0.15;
    if (mode.includes('walk')) ratePerKm = 0.0;

    return Math.round(distanceKm * ratePerKm);
  }, [itinerary, routeTelemetry]);

  // Current Total & Health
  const currentTotalCost = accommodationTotal + activitiesTotal + transportEstimate;
  const remainingBudget = targetBudget - currentTotalCost;
  const budgetRatio = targetBudget > 0 ? currentTotalCost / targetBudget : 0;
  const budgetPercentUsed = Math.min(100, Math.round(budgetRatio * 100));

  // Health Color Category
  let healthTheme = {
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeText: 'Under Budget'
  };

  if (budgetRatio > 1.0) {
    healthTheme = {
      barColor: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      badgeText: `Over by ${format(Math.abs(remainingBudget))}`
    };
  } else if (budgetRatio >= 0.8) {
    healthTheme = {
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeText: 'Near Budget Limit'
    };
  }

  // Transport Icon
  const TransportIcon = useMemo(() => {
    const mode = (itinerary?.transportMode || '').toLowerCase();
    if (mode.includes('train')) return Train;
    if (mode.includes('tuktuk') || mode.includes('tuk-tuk')) return Bike;
    if (mode.includes('walk')) return Footprints;
    return Car;
  }, [itinerary?.transportMode]);

  // Filter addable catalog for drawer
  const filteredCatalog = useMemo(() => {
    return ADDABLE_PLACES_CATALOG.filter(place => {
      const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            place.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || place.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="itinerary-editor-container w-full h-full overflow-y-auto flex flex-col bg-white/95 dark:bg-slate-900/95">
      
      {/* ==================================================================== */}
      {/* 1. STICKY GLASSMORPHIC HEADER & LIVE BUDGET HEALTH TRACKER */}
      {/* ==================================================================== */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          <button 
            type="button"
            onClick={onNavigateBack} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Smart Planner
          </button>

          {/* Undo Action Button (HCI Error Recovery) */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition select-none ${
              canUndo 
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm'
                : 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
            }`}
            title={canUndo ? `Undo last itinerary modification (${undoCount} in history)` : 'No actions to undo'}
          >
            <RotateCcw size={13} className={canUndo ? 'text-blue-600' : ''} />
            <span>Undo {undoCount > 0 ? `(${undoCount})` : ''}</span>
          </button>
        </div>

        {/* Title & Metadata */}
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-extrabold mb-1">
            <Sparkles size={12} /> {itinerary.vibe || "Curated"} Itinerary
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
            {itinerary.tripTitle || `${itinerary.destinationCity} Smart Escapade`}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {itinerary.summary?.transportBreakdown || `${itinerary.transportMode || 'Private Van'} • Auto-calculated Sri Lankan road routes`}
          </p>
        </div>

        {/* Dynamic Budget Health Bar */}
        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold uppercase tracking-wider text-[11px]">
              <Wallet size={14} className="text-emerald-500" /> Budget Health Tracker
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                budgetRatio > 1.0 
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' 
                  : budgetRatio >= 0.8 
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' 
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              }`}>
                {healthTheme.badgeText}
              </span>
              <strong className={`text-base font-black ${healthTheme.textColor}`}>
                {format(currentTotalCost)} / {format(targetBudget)}
              </strong>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full rounded-full ${healthTheme.barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${budgetPercentUsed}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
              <BedDouble size={13} className="text-amber-500 flex-shrink-0" />
              <span className="truncate">Stays: <strong className="text-slate-900 dark:text-slate-200">{format(accommodationTotal)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
              <Camera size={13} className="text-blue-500 flex-shrink-0" />
              <span className="truncate">Places: <strong className="text-slate-900 dark:text-slate-200">{format(activitiesTotal)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
              <TransportIcon size={13} className="text-purple-500 flex-shrink-0" />
              <span className="truncate">Ride: <strong className="text-slate-900 dark:text-slate-200">~{format(transportEstimate)}</strong></span>
            </div>
          </div>
        </div>

        {/* Global Action Row: Save Trip, Share Trip, Book Selected Hotels, Export */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button 
            variant="primary" 
            size="sm"
            onClick={onSaveTrip}
            loading={isSaving}
            icon={<Save size={13} />}
            className="text-xs py-2 shadow-blue-500/20 font-bold"
          >
            {isSaved ? 'Saved ✓' : 'Save Trip'}
          </Button>

          <Button 
            variant="glass" 
            size="sm"
            onClick={onShareTrip}
            icon={<Share2 size={13} />}
            className="text-xs py-2 font-bold"
          >
            Share Link
          </Button>

          <Button 
            variant="accent" 
            size="sm"
            onClick={onBookHotels}
            icon={<BedDouble size={13} />}
            className="text-xs py-2 shadow-amber-500/20 font-bold"
          >
            Book Hotel
          </Button>

          <Button 
            variant="glass" 
            size="sm"
            onClick={onDownload}
            icon={<Download size={13} />}
            className="text-xs py-2 font-bold"
            title="Download formatted JSON itinerary"
          >
            Export
          </Button>
        </div>

        {/* Day Filter Tabs */}
        {itinerary.days && itinerary.days.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => onDayChange && onDayChange('all')}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center text-xs relative ${
                activeDay === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All days
            </button>
            {itinerary.days.map(d => (
              <button
                key={d.dayNumber}
                type="button"
                onClick={() => onDayChange && onDayChange(d.dayNumber)}
                aria-pressed={activeDay === d.dayNumber}
                className={`flex-1 py-1 rounded-lg transition cursor-pointer text-center text-xs relative leading-tight ${
                  activeDay === d.dayNumber
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Day {d.dayNumber}
                {d.date && <span className="block text-[10px] font-semibold opacity-70">{formatDayDate(d.date)}</span>}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* ==================================================================== */}
      {/* 2. TIMELINE CONTENT & NATIVE FRAMER-MOTION REORDER GROUP */}
      {/* ==================================================================== */}
      <div className="p-5 flex-1 space-y-6">
        
        {/* Recommended Hotel Block (Stay Anchor) */}
        {itinerary.recommendedHotel && !hasNightlyHotels && (
          <div className="border border-amber-200/90 dark:border-amber-900/60 rounded-2xl p-4 bg-gradient-to-br from-amber-50/80 to-amber-100/30 dark:from-amber-950/30 dark:to-slate-900/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <BedDouble size={14} /> Recommended Accommodation
              </span>
              <button
                type="button"
                onClick={() => onSwapItem(itinerary.recommendedHotel, 1)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                <RefreshCw size={12} /> Swap Stay
              </button>
            </div>

            <div className="flex items-start gap-3.5">
              {itinerary.recommendedHotel.image_url && (
                <img 
                  src={itinerary.recommendedHotel.image_url} 
                  alt={itinerary.recommendedHotel.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-amber-200 dark:border-amber-800"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {itinerary.recommendedHotel.name}
                  </h3>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 ml-2">
                    {format(itinerary.recommendedHotel.pricePerNightUSD)}/night
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {itinerary.recommendedHotel.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star size={11} className="fill-amber-500" />
                    {itinerary.recommendedHotel.rating}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{itinerary.recommendedHotel.city}</span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => onFocusLocation({
                      latitude: itinerary.recommendedHotel.latitude,
                      longitude: itinerary.recommendedHotel.longitude,
                      name: itinerary.recommendedHotel.name
                    })}
                    className="inline-flex items-center gap-0.5 text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    <MapPin size={10} /> View on Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Days Timeline Groups */}
        {Array.isArray(itinerary.days) && itinerary.days.map((day) => {
          if (activeDay !== 'all' && day.dayNumber !== activeDay) return null;

          const isAddingToThisDay = addingStopForDay === day.dayNumber;

          return (
            <div 
              key={day.dayNumber}
              className="border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 bg-slate-50/70 dark:bg-slate-850/40 space-y-4 shadow-sm"
            >
              {/* Day Header: date, route, weather */}
              <div className="border-b border-slate-200/60 dark:border-slate-700/60 pb-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2.5 py-0.5 rounded-xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider flex-shrink-0">
                      Day {day.dayNumber}
                    </span>
                    {day.date && (
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{formatDayDate(day.date)}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold flex-shrink-0">
                    {(day.items || []).filter(it => it.type !== 'hotel').length} activities
                  </span>
                </div>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Navigation size={14} className="text-blue-600 flex-shrink-0" />
                  {day.theme || `Exploration Day ${day.dayNumber}`}
                </h2>
                {day.weather && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[11px] font-semibold">
                    <CloudSun size={13} /> {day.weather}
                  </span>
                )}
              </div>

              {/* Native Framer-Motion Reorder Group */}
              <Reorder.Group
                axis="y"
                values={day.items || []}
                onReorder={(newOrderedItems) => onReorderItems(day.dayNumber, newOrderedItems)}
                className="space-y-1 list-none"
              >
                {(day.items || []).map((item, idx) => {
                  const itemKey = item.reference_id || item.id || `day-${day.dayNumber}-item-${idx}`;
                  const catClass = CATEGORY_STYLES[(item.category || '').toLowerCase()] || CATEGORY_STYLES.culture;
                  const placeNumber = (day.items || []).slice(0, idx + 1).filter(it => it.type !== 'hotel').length;
                  const nextItem = day.items[idx + 1];
                  const legKm = nextItem ? kmBetween(item, nextItem) : null;

                  // The night's hotel: highlighted "Tonight's stay" card, not a numbered sight
                  if (item.type === 'hotel' && hasNightlyHotels) {
                    return (
                      <React.Fragment key={itemKey}>
                        <Reorder.Item
                          value={item}
                          dragListener={false}
                          className="relative mt-2 p-3.5 rounded-2xl border-2 border-amber-300/90 dark:border-amber-700/70 bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/40 dark:to-slate-900/60 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                              <BedDouble size={17} />
                            </div>
                            {item.image_url && (
                              <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-amber-200 dark:border-amber-800" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Tonight's stay · Night {day.dayNumber}
                              </div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-black text-sm text-slate-900 dark:text-white">{item.name}</h3>
                                <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex-shrink-0">
                                  {item.costUSD > 0 ? `${format(item.costUSD)}/night` : 'Price on request'}
                                </span>
                              </div>
                              {item.roomConfiguration && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{item.roomConfiguration}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-[10px]">
                                {item.bookable ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                                    <BadgeCheck size={11} /> Bookable on Aurelia
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">Found online</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onFocusLocation({ latitude: item.latitude, longitude: item.longitude, name: item.name })}
                                  className="inline-flex items-center gap-0.5 text-blue-600 hover:underline font-bold cursor-pointer"
                                >
                                  <MapPin size={10} /> View on map
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSwapItem(item, day.dayNumber)}
                                  className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                                >
                                  <RefreshCw size={10} /> Change hotel
                                </button>
                              </div>
                            </div>
                          </div>
                        </Reorder.Item>
                      </React.Fragment>
                    );
                  }

                  return (
                    <React.Fragment key={itemKey}>
                      <Reorder.Item
                        value={item}
                        className="group relative bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:border-blue-500/80 transition-all cursor-default select-none"
                        whileDrag={{ 
                          scale: 1.02, 
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                          borderColor: "#3b82f6" 
                        }}
                      >
                        <div className="flex items-start gap-3">
                          
                          {/* Drag Handle */}
                          <div 
                            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 pt-1 transition"
                            title="Drag to reorder stop"
                          >
                            <GripVertical size={16} />
                          </div>

                          {/* Chronological Sequence Badge */}
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            {hasNightlyHotels ? placeNumber : idx + 1}
                          </div>

                          {/* Thumbnail Image */}
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-slate-100 dark:border-slate-700"
                            />
                          )}

                          {/* Card Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="font-black text-xs text-slate-900 dark:text-white">
                                {item.name}
                              </h3>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 ml-1 flex-shrink-0">
                                {item.costUSD > 0 ? format(item.costUSD) : 'Free'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                              {item.notes || item.description}
                            </p>

                            {/* Meta & Actions Bar */}
                            <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                              
                              {/* Left Meta: Time & Category */}
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 font-semibold text-slate-500">
                                  <Clock size={11} /> {item.timeSlot || '~90 mins'}
                                </span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${catClass}`}>
                                  {item.category || 'Sight'}
                                </span>
                              </div>

                              {/* Right Actions: View on Map, Swap, Delete */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onFocusLocation({
                                    latitude: item.latitude,
                                    longitude: item.longitude,
                                    name: item.name
                                  })}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                                  title="View on Map"
                                >
                                  <MapPin size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onSwapItem(item, day.dayNumber)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition cursor-pointer"
                                  title="Swap Attraction"
                                >
                                  <RefreshCw size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onRemoveItem(item, day.dayNumber)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                                  title="Delete from Day"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                            </div>

                          </div>
                        </div>
                      </Reorder.Item>

                      {/* Travel Connector to Next Stop (only when both stops have a location) */}
                      {legKm !== null && (
                        <div className="travel-connector-line">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[10px] text-slate-500 font-bold shadow-xs select-none">
                            <TransportIcon size={12} className="text-blue-500" />
                            <span>{legKm < 1 ? 'Under 1 km' : `≈ ${Math.round(legKm * 1.3)} km by road`}{nextItem?.type === 'hotel' ? ' to your hotel' : ''}</span>
                          </div>
                        </div>
                      )}

                    </React.Fragment>
                  );
                })}
              </Reorder.Group>

              {/* Add Stop to Day X Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setAddingStopForDay(isAddingToThisDay ? null : day.dayNumber)}
                  className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 hover:border-blue-400 text-xs font-bold text-slate-600 dark:text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle size={15} className="text-blue-600" />
                  <span>{isAddingToThisDay ? 'Cancel Adding Stop' : `Add Stop to Day ${day.dayNumber}`}</span>
                </button>
              </div>

              {/* Expandable Add Stop Drawer / Catalog */}
              <AnimatePresence>
                {isAddingToThisDay && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 bg-white dark:bg-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Search size={13} className="text-blue-600" />
                        <span>Insert Attraction into Day {day.dayNumber}</span>
                      </span>
                      <button 
                        type="button"
                        onClick={() => setAddingStopForDay(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Search & Category Filter */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search Sri Lankan spots..."
                          className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                        />
                        <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      </div>

                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-xs px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold outline-none"
                      >
                        <option value="all">All Categories</option>
                        <option value="nature">Nature</option>
                        <option value="history">History</option>
                        <option value="culture">Culture</option>
                        <option value="adventure">Adventure</option>
                        <option value="relaxation">Relaxation</option>
                      </select>
                    </div>

                    {/* Quick Catalog List */}
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {filteredCatalog.map((place) => (
                        <div 
                          key={place.reference_id}
                          className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-3 hover:border-blue-400 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {place.image_url && (
                              <img 
                                src={place.image_url} 
                                alt={place.name} 
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {place.name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <span>{place.city}</span>
                                <span>•</span>
                                <span className="font-bold text-emerald-600">
                                  {place.costUSD > 0 ? format(place.costUSD) : 'Free'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onAddStop(day.dayNumber, place);
                              setAddingStopForDay(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer flex-shrink-0"
                          >
                            <Check size={11} />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}

      </div>

    </div>
  );
}
