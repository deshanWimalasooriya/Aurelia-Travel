import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, CheckCircle, Sparkles, AlertCircle, 
  Save, Share2, BedDouble, ArrowLeft 
} from 'lucide-react';

import ItineraryEditor from '../components/ui/ItineraryEditor';
import TripMapVisualizer from '../components/ui/TripMapVisualizer';
import SwapItemModal from '../components/ui/SwapItemModal';
import ShareTripModal from '../components/ui/ShareTripModal';
import Button from '../components/common/Button';
import { tripAPI } from '../services/api';
import { CurrencyToggle } from '../context/CurrencyContext';
import './styles/travelPlanPage.css';

// ============================================================================
// 1. REALISTIC SRI LANKA FALLBACK ITINERARY (When visited directly)
// ============================================================================
const DEFAULT_SRI_LANKA_ITINERARY = {
  tripTitle: "Kandy to Ella Scenic Highlands",
  destinationCity: "Kandy",
  vibe: "Nature & Culture",
  durationDays: 2,
  budgetUSD: 250,
  transportMode: "Private Van",
  recommendedHotel: {
    id: 101,
    reference_id: 101,
    name: "The Radh Luxury Boutique Hotel",
    city: "Kandy",
    latitude: 7.2936,
    longitude: 80.6382,
    pricePerNightUSD: 75,
    costUSD: 75,
    rating: 4.8,
    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
    description: "Premium boutique stay in the heart of Kandy, walking distance to the Temple of the Tooth."
  },
  days: [
    {
      dayNumber: 1,
      theme: "The Hill Capital Heritage",
      date: "Day 1",
      items: [
        {
          type: "place",
          reference_id: 201,
          id: 201,
          name: "Temple of the Sacred Tooth Relic",
          city: "Kandy",
          category: "Culture",
          latitude: 7.2936,
          longitude: 80.6413,
          timeSlot: "09:00 AM - 11:30 AM",
          durationMins: 150,
          costUSD: 15,
          rating: 4.9,
          notes: "Sacred Buddhist temple housing the relic of the tooth of the Buddha, a UNESCO World Heritage site.",
          image_url: "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=600&q=80"
        },
        {
          type: "place",
          reference_id: 202,
          id: 202,
          name: "Royal Botanical Gardens, Peradeniya",
          city: "Kandy",
          category: "Nature",
          latitude: 7.2715,
          longitude: 80.5956,
          timeSlot: "01:00 PM - 03:30 PM",
          durationMins: 150,
          costUSD: 10,
          rating: 4.8,
          notes: "World-famous botanical haven featuring over 4,000 plant species and towering Royal Palm avenues.",
          image_url: "https://images.unsplash.com/photo-1546768292-fb12f6c92568?auto=format&fit=crop&w=600&q=80"
        },
        {
          type: "place",
          reference_id: 203,
          id: 203,
          name: "Kandy Lake Viewpoint & Sunset Walk",
          city: "Kandy",
          category: "Relaxation",
          latitude: 7.2882,
          longitude: 80.6355,
          timeSlot: "05:00 PM - 06:30 PM",
          durationMins: 90,
          costUSD: 0,
          rating: 4.7,
          notes: "Panoramic sunset view overlooking the tranquil Kandy Lake and surrounding mist-clad peaks.",
          image_url: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=600&q=80"
        }
      ]
    },
    {
      dayNumber: 2,
      theme: "The Misty Tea Hills & Viaducts",
      date: "Day 2",
      items: [
        {
          type: "place",
          reference_id: 204,
          id: 204,
          name: "Nine Arches Bridge, Ella",
          city: "Ella",
          category: "History",
          latitude: 6.8767,
          longitude: 81.0608,
          timeSlot: "09:00 AM - 11:30 AM",
          durationMins: 150,
          costUSD: 0,
          rating: 4.9,
          notes: "Magnificent colonial-era stone railway bridge perched amidst lush emerald tea plantations.",
          image_url: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80"
        },
        {
          type: "place",
          reference_id: 205,
          id: 205,
          name: "Little Adam's Peak Trek",
          city: "Ella",
          category: "Adventure",
          latitude: 6.8624,
          longitude: 81.0543,
          timeSlot: "01:30 PM - 04:00 PM",
          durationMins: 150,
          costUSD: 0,
          rating: 4.8,
          notes: "Gentle trek with 360-degree breathtaking vistas across Ella Gap and Ella Rock.",
          image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80"
        },
        {
          type: "place",
          reference_id: 206,
          id: 206,
          name: "Ravana Waterfalls & Gorge",
          city: "Ella",
          category: "Nature",
          latitude: 6.8406,
          longitude: 81.0544,
          timeSlot: "04:30 PM - 06:00 PM",
          durationMins: 90,
          costUSD: 0,
          rating: 4.6,
          notes: "Cascading 25-meter multi-tiered waterfall steeped in Ramayana folklore.",
          image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
        }
      ]
    }
  ],
  summary: {
    totalEstimatedCost: 100,
    totalDistanceKm: 142,
    transportBreakdown: "Private Van road transfer with scenic stopovers"
  }
};

/**
 * TravelPlanPage - Phase 3 Smart Plan Workspace
 * 
 * Features:
 * - 55% Left Panel (ItineraryEditor.jsx) + 45% Right Panel (TripMapVisualizer.jsx)
 * - Top Action Bar with "Save Trip", "Share Trip", and "Book Selected Hotels"
 * - ShareTripModal for 1-click public link copying and social sharing
 * - Direct checkout linking for chosen hotels
 */
const TravelPlanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Initialize itinerary from navigation state or realistic fallback
  const initialData = location.state?.itinerary || DEFAULT_SRI_LANKA_ITINERARY;
  const [itinerary, setItinerary] = useState(initialData);

  // travel-Agent-2.0 returns up to 3 alternative routes; let the user switch between them
  const routeOptions = location.state?.routeOptions || [];
  const [routeIndex, setRouteIndex] = useState(0);
  const handleSelectRoute = (idx) => {
    setRouteIndex(idx);
    setItinerary(routeOptions[idx]);
    setActiveDay(firstDayOf(routeOptions[idx]));
    setHistoryStack([]);
  };

  // 2. Active Day filter ('all' or day number 1, 2, 3...)
  // Multi-day plans open on Day 1 so it's clear what happens on each date
  const firstDayOf = (plan) => (plan?.days?.length > 1 ? plan.days[0].dayNumber : 'all');
  const [activeDay, setActiveDay] = useState(() => firstDayOf(initialData));

  // 3. Mobile view switcher ('timeline' | 'map')
  const [mobileTab, setMobileTab] = useState('timeline');

  // 4. Live route telemetry from OSRM
  const [routeTelemetry, setRouteTelemetry] = useState(null);

  // 5. Leaflet FlyTo focus coordinate
  const [focusLocation, setFocusLocation] = useState(null);

  // 6. Undo History Stack (HCI Error Recovery)
  const [historyStack, setHistoryStack] = useState([]);

  // 7. Modals State
  const [swapModal, setSwapModal] = useState({ isOpen: false, targetItem: null, targetDayNumber: 1 });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(initialData.id));

  // 8. Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  // Push current state to undo history stack (capped at 15 steps)
  const pushHistory = (currentState) => {
    const clone = JSON.parse(JSON.stringify(currentState));
    setHistoryStack(prev => [...prev.slice(-14), clone]);
  };

  // Undo Last Change
  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, prev.length - 1));
    setItinerary(previous);
    showToast('Undid last change', 'info');
  };

  // ==========================================================================
  // HANDLER: Save Trip (POST /api/trips/save)
  // ==========================================================================
  const handleSaveTrip = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: itinerary.id || null,
        title: itinerary.tripTitle || `${itinerary.destinationCity} Smart Escapade`,
        destinationCity: itinerary.destinationCity,
        durationDays: itinerary.durationDays || itinerary.days?.length || 2,
        targetBudgetUSD: itinerary.budgetUSD || 250,
        totalEstimatedCostUSD: itinerary.summary?.totalEstimatedCost || 120,
        transportMode: itinerary.transportMode || 'Private Van',
        vibe: itinerary.vibe || 'Relaxing',
        isPublic: true,
        days: itinerary.days || [],
        recommendedHotel: itinerary.recommendedHotel || null
      };

      const res = await tripAPI.saveTrip(payload);
      if (res.data && res.data.success && res.data.data) {
        const savedData = res.data.data;
        setItinerary(prev => ({
          ...prev,
          id: savedData.id,
          share_uuid: savedData.share_uuid
        }));
        setIsSaved(true);
        showToast('Smart Itinerary saved to your dashboard!');
        return savedData;
      }
    } catch (err) {
      console.error('Failed to save trip:', err);
      if (err.response?.status === 401) {
        showToast('Please login to save trips to your personal dashboard.', 'info');
      } else {
        showToast(err.response?.data?.message || 'Failed to save itinerary.', 'error');
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // HANDLER: Share Trip (Opens Share Modal + Auto-saves if unsaved)
  // ==========================================================================
  const handleShareTrip = async () => {
    if (!itinerary.share_uuid) {
      const saved = await handleSaveTrip();
      if (saved && saved.share_uuid) {
        setIsShareModalOpen(true);
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  // ==========================================================================
  // HANDLER: Book Selected Hotels (Links to Hotel Booking checkout flow)
  // ==========================================================================
  const handleBookSelectedHotels = () => {
    if (itinerary.recommendedHotel) {
      const hotelId = itinerary.recommendedHotel.reference_id || itinerary.recommendedHotel.id;
      showToast(`Redirecting to reservation checkout for ${itinerary.recommendedHotel.name}...`);
      setTimeout(() => {
        navigate(`/hotel/${hotelId}`);
      }, 500);
    } else {
      showToast('No hotel currently selected. Swap an item to select an accommodation stay.', 'info');
    }
  };

  // ==========================================================================
  // HANDLER: Reorder Places within a Day (framer-motion Reorder)
  // ==========================================================================
  const handleReorderItems = (dayNumber, newOrderedItems) => {
    pushHistory(itinerary);
    setItinerary(prev => {
      const nextDays = (prev.days || []).map(day => {
        if (day.dayNumber !== dayNumber) return day;
        return { ...day, items: newOrderedItems };
      });
      return { ...prev, days: nextDays };
    });
  };

  // ==========================================================================
  // HANDLER: Open Swap Modal
  // ==========================================================================
  const handleOpenSwapModal = (item, dayNumber = 1) => {
    setSwapModal({
      isOpen: true,
      targetItem: item,
      targetDayNumber: dayNumber || 1
    });
  };

  // ==========================================================================
  // HANDLER: Confirm Item Swap from SwapItemModal
  // ==========================================================================
  const handleSelectAlternative = (newAlt, dayNumber) => {
    pushHistory(itinerary);
    const target = swapModal.targetItem;
    if (!target) return;

    if (target.type === 'hotel') {
      setItinerary(prev => ({
        ...prev,
        recommendedHotel: {
          ...newAlt,
          type: 'hotel',
          pricePerNightUSD: newAlt.costUSD || newAlt.pricePerNightUSD,
          costUSD: newAlt.costUSD || newAlt.pricePerNightUSD
        }
      }));
      showToast(`Swapped hotel to ${newAlt.name}!`);
    } else {
      setItinerary(prev => {
        const nextDays = (prev.days || []).map(day => {
          if (day.dayNumber !== dayNumber) return day;

          const updated = (day.items || []).map(item => {
            const isMatch = (item.reference_id && item.reference_id === target.reference_id) ||
                            (item.id && item.id === target.id) ||
                            (item.name === target.name);
            if (isMatch) {
              return {
                ...newAlt,
                type: 'place',
                timeSlot: item.timeSlot || '02:00 PM - 04:00 PM',
                notes: newAlt.notes || newAlt.description || 'Verified Sri Lankan sight.'
              };
            }
            return item;
          });

          return { ...day, items: updated };
        });

        return { ...prev, days: nextDays };
      });
      showToast(`Replaced with ${newAlt.name}!`);
    }

    setSwapModal({ isOpen: false, targetItem: null, targetDayNumber: 1 });
  };

  // ==========================================================================
  // HANDLER: Delete Item from Itinerary
  // ==========================================================================
  const handleRemoveItem = (itemToRemove, dayNumber) => {
    if (!itemToRemove) return;
    pushHistory(itinerary);

    if (itemToRemove.type === 'hotel') {
      setItinerary(prev => ({ ...prev, recommendedHotel: null }));
      showToast('Hotel stay removed from itinerary', 'info');
      return;
    }

    setItinerary(prev => {
      const nextDays = (prev.days || []).map(day => {
        if (dayNumber && day.dayNumber !== dayNumber) return day;

        const remaining = (day.items || []).filter(item => {
          if (itemToRemove.reference_id && item.reference_id) {
            return item.reference_id !== itemToRemove.reference_id;
          }
          if (itemToRemove.id && item.id) {
            return item.id !== itemToRemove.id;
          }
          return item.name !== itemToRemove.name;
        });

        return { ...day, items: remaining };
      });

      return { ...prev, days: nextDays };
    });

    showToast(`Removed "${itemToRemove.name}" from itinerary`, 'info');
  };

  // ==========================================================================
  // HANDLER: Add Stop to Day X (from Drawer)
  // ==========================================================================
  const handleAddStop = (dayNumber, newPlace) => {
    pushHistory(itinerary);

    setItinerary(prev => {
      const nextDays = (prev.days || []).map(day => {
        if (day.dayNumber !== dayNumber) return day;

        const currentItems = day.items || [];
        const newItem = {
          ...newPlace,
          type: 'place',
          timeSlot: '03:00 PM - 04:30 PM'
        };

        return { ...day, items: [...currentItems, newItem] };
      });

      return { ...prev, days: nextDays };
    });

    showToast(`Added "${newPlace.name}" to Day ${dayNumber}!`);
  };

  // ==========================================================================
  // HANDLER: View on Map (FlyTo marker & mobile auto-switch)
  // ==========================================================================
  const handleFocusLocation = (loc) => {
    setFocusLocation({ ...loc, timestamp: Date.now() });
    setMobileTab('map');
  };

  // ==========================================================================
  // HANDLER: Download JSON Itinerary
  // ==========================================================================
  const handleDownloadItinerary = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itinerary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Aurelia_Smart_Plan_${itinerary.destinationCity || 'Sri_Lanka'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Itinerary exported as JSON!');
  };

  return (
    <div className="travel-plan-page tw-preflight min-h-[calc(100vh-76px)] h-[calc(100vh-76px)] flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-[3000] px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 border select-none ${
              toast.type === 'info'
                ? 'bg-slate-900/95 dark:bg-slate-800/95 text-white border-slate-700'
                : 'bg-emerald-600/95 text-white border-emerald-400/40 shadow-emerald-500/20'
            }`}
          >
            <CheckCircle size={15} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* TOP PERSISTENT ACTION BAR: SAVE, SHARE & BOOK */}
      {/* ==================================================================== */}
      <div className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            type="button"
            onClick={() => navigate('/travel-plan')} 
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
            title="Back to Smart Planner"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
              {itinerary.tripTitle || `${itinerary.destinationCity} Itinerary`}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{itinerary.destinationCity}</span>
              <span>•</span>
              <span>{itinerary.durationDays} Days</span>
            </div>
            {routeOptions.length > 1 && (
              <div className="flex gap-1 mt-1">
                {routeOptions.map((opt, idx) => (
                  <button
                    key={opt.tripTitle || idx}
                    type="button"
                    onClick={() => handleSelectRoute(idx)}
                    title={opt.whyItFits || opt.tripTitle}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      idx === routeIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Route {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <CurrencyToggle />
          <Button
            variant="glass"
            size="sm"
            onClick={handleShareTrip}
            icon={<Share2 size={13} />}
            className="text-xs py-1.5 font-bold"
          >
            Share Trip
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={handleBookSelectedHotels}
            icon={<BedDouble size={13} />}
            className="text-xs py-1.5 font-bold shadow-amber-500/20"
          >
            Book Selected Hotels
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveTrip}
            loading={isSaving}
            icon={<Save size={13} />}
            className="text-xs py-1.5 font-bold shadow-blue-500/25"
          >
            {isSaved ? 'Saved ✓' : 'Save Trip'}
          </Button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE / TABLET VIEW SWITCHER TAB BAR (Screens < lg) */}
      {/* ==================================================================== */}
      <div className="lg:hidden p-2.5 px-4 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold w-full max-w-sm shadow-inner">
          <button
            type="button"
            onClick={() => setMobileTab('timeline')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'timeline' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock size={14} />
            <span>Timeline View</span>
          </button>
          
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'map' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MapPin size={14} />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SPLIT-SCREEN WORKSPACE: 55% LEFT PANEL + 45% RIGHT PANEL */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* 1. LEFT PANEL (55%): ItineraryEditor */}
        <div className={`w-full lg:w-[55%] h-full overflow-hidden border-r border-slate-200/70 dark:border-slate-800 ${
          mobileTab === 'timeline' ? 'block' : 'hidden lg:block'
        }`}>
          <ItineraryEditor
            itinerary={itinerary}
            activeDay={activeDay}
            onDayChange={setActiveDay}
            routeTelemetry={routeTelemetry}
            onReorderItems={handleReorderItems}
            onSwapItem={handleOpenSwapModal}
            onRemoveItem={handleRemoveItem}
            onAddStop={handleAddStop}
            onFocusLocation={handleFocusLocation}
            onUndo={handleUndo}
            canUndo={historyStack.length > 0}
            undoCount={historyStack.length}
            onDownload={handleDownloadItinerary}
            onConfirmPlan={() => showToast('Smart Itinerary confirmed! Proceeding to reservations.')}
            onNavigateBack={() => navigate('/travel-plan')}
            onSaveTrip={handleSaveTrip}
            isSaving={isSaving}
            onShareTrip={handleShareTrip}
            onBookHotels={handleBookSelectedHotels}
            isSaved={Boolean(itinerary.id || isSaved)}
          />
        </div>

        {/* 2. RIGHT PANEL (45%): TripMapVisualizer */}
        <div className={`w-full lg:w-[45%] h-full relative ${
          mobileTab === 'map' ? 'block' : 'hidden lg:block'
        }`}>
          <TripMapVisualizer
            itinerary={itinerary}
            activeDay={activeDay}
            onDayChange={setActiveDay}
            transportMode={itinerary.transportMode || 'Private Van'}
            onRouteTelemetry={setRouteTelemetry}
            onSwapItem={(item) => handleOpenSwapModal(item, 1)}
            onRemoveItem={handleRemoveItem}
            focusLocation={focusLocation}
            routeColor="#2563eb"
            height="100%"
          />
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 3. MODALS: SWAP MODAL & SHARE MODAL */}
      {/* ==================================================================== */}
      <SwapItemModal
        isOpen={swapModal.isOpen}
        onClose={() => setSwapModal(prev => ({ ...prev, isOpen: false }))}
        targetItem={swapModal.targetItem}
        targetDayNumber={swapModal.targetDayNumber}
        destinationCity={itinerary.destinationCity || 'Kandy'}
        onSelectAlternative={handleSelectAlternative}
        currentTripBudget={itinerary.budgetUSD || 250}
      />

      <ShareTripModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUuid={itinerary.share_uuid}
        tripTitle={itinerary.tripTitle}
        destinationCity={itinerary.destinationCity}
        onCopiedToast={showToast}
      />

    </div>
  );
};

export default TravelPlanPage;
