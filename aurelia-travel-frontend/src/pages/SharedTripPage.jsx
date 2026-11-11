import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, MapPin, Clock, Calendar, DollarSign, 
  Car, Train, Bike, Footprints, BedDouble, Camera, 
  Share2, ArrowRight, AlertCircle, Home, CheckCircle 
} from 'lucide-react';
import { tripAPI } from '../services/api';
import TripMapVisualizer from '../components/ui/TripMapVisualizer';
import ShareTripModal from '../components/ui/ShareTripModal';
import Button from '../components/common/Button';

// Category color mappings
const CATEGORY_STYLES = {
  nature: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  history: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  culture: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  adventure: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  relaxation: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
};

/**
 * SharedTripPage (`/trip/share/:uuid`)
 * 
 * Public showcase of a shared Aurelia Smart Plan with interactive road routing map,
 * chronological timeline, and "Clone & Customize This Trip" CTA banner.
 */
export default function SharedTripPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!uuid) {
      setError('Invalid share link.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchSharedItinerary = async () => {
      try {
        const res = await tripAPI.getSharedTrip(uuid);
        if (isMounted) {
          if (res.data && res.data.success && res.data.data) {
            setItinerary(res.data.data);
          } else {
            setError(res.data?.message || 'Itinerary not found.');
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load shared trip:', err);
          setError(err.response?.data?.message || 'Shared itinerary not found or has been made private.');
          setLoading(false);
        }
      }
    };

    fetchSharedItinerary();
    return () => { isMounted = false; };
  }, [uuid]);

  // Clone & Customize This Trip CTA
  const handleCloneAndCustomize = () => {
    if (!itinerary) return;

    // Strip saved trip ID so user saves as a new customized copy
    const clonedTrip = {
      ...itinerary,
      id: null,
      share_uuid: null,
      tripTitle: `${itinerary.tripTitle || itinerary.destinationCity} (My Customized Copy)`
    };

    navigate('/travel-itinerary', {
      state: {
        itinerary: clonedTrip,
        formData: {
          destinationCity: itinerary.destinationCity,
          durationDays: itinerary.durationDays,
          budgetUSD: itinerary.budgetUSD,
          vibe: itinerary.vibe,
          transportMode: itinerary.transportMode
        }
      }
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-76px)] flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-black">Loading Shared Smart Plan...</h2>
        <p className="text-xs text-slate-400 mt-1">Retrieving verified Sri Lankan road routes and stops</p>
      </div>
    );
  }

  // Error / Expired State
  if (error || !itinerary) {
    return (
      <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-8 rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center shadow-inner">
            <AlertCircle size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Trip Not Available</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {error || 'This shared trip link might have expired or been set to private by its creator.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/travel-plan')}
              className="w-full text-xs shadow-blue-500/25"
            >
              Generate Your Own Smart Plan
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/')}
              className="w-full text-xs"
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-trip-page min-h-[calc(100vh-76px)] flex flex-col bg-slate-50 dark:bg-slate-950 relative">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[3000] px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2">
          <CheckCircle size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. TOP GLASSMORPHIC CTA BANNER */}
      {/* ==================================================================== */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-r from-blue-900/95 via-indigo-900/95 to-slate-900/95 text-white border-b border-white/10 px-6 py-3.5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 flex-shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              Viewing a shared Aurelia Smart Plan — Want to make it your own?
            </div>
            <div className="text-[11px] text-blue-300/80">
              Customize dates, add activities, swap luxury stays, and adjust budgets freely.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>

          <Button
            variant="accent"
            size="sm"
            onClick={handleCloneAndCustomize}
            icon={<Sparkles size={13} />}
            className="text-xs py-1.5 font-black shadow-amber-500/30 cursor-pointer"
          >
            Clone & Customize This Trip
          </Button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SPLIT-SCREEN WORKSPACE: 50% TIMELINE + 50% LEAFLET MAP */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Itinerary Showcase (50%) */}
        <div className="w-full lg:w-1/2 p-6 overflow-y-auto space-y-6 border-r border-slate-200/80 dark:border-slate-800">
          
          {/* Header Card */}
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] uppercase tracking-wider">
                {itinerary.vibe || 'Curated'} Escapade
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500">
                {itinerary.durationDays} Days Itinerary
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {itinerary.tripTitle || `${itinerary.destinationCity} Smart Plan`}
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {itinerary.summary?.transportBreakdown || `${itinerary.transportMode} • Scenic Sri Lankan road route`}
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Total</span>
                <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  ${itinerary.summary?.totalEstimatedCost || 120} USD
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Transport</span>
                <strong className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block">
                  {itinerary.transportMode || 'Private Van'}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Budget</span>
                <strong className="text-sm font-black text-slate-800 dark:text-slate-200">
                  ${itinerary.budgetUSD || 250} USD
                </strong>
              </div>
            </div>
          </div>

          {/* Recommended Hotel Stay */}
          {itinerary.recommendedHotel && (
            <div className="border border-amber-200/90 dark:border-amber-900/60 rounded-3xl p-5 bg-gradient-to-br from-amber-50/80 to-amber-100/30 dark:from-amber-950/30 dark:to-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <BedDouble size={14} /> Recommended Accommodation
                </span>
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                  ${itinerary.recommendedHotel.pricePerNightUSD}/night
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                {itinerary.recommendedHotel.image_url && (
                  <img 
                    src={itinerary.recommendedHotel.image_url} 
                    alt={itinerary.recommendedHotel.name}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-amber-200 dark:border-amber-800"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {itinerary.recommendedHotel.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {itinerary.recommendedHotel.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {itinerary.recommendedHotel.city}
                    </span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/hotel/${itinerary.recommendedHotel.id || itinerary.recommendedHotel.reference_id}`)}
                      className="text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      View Hotel Rates →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Days */}
          <div className="space-y-4">
            {Array.isArray(itinerary.days) && itinerary.days.map((day) => (
              <div 
                key={day.dayNumber}
                className="border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 bg-white/90 dark:bg-slate-900/90 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="px-2.5 py-0.5 rounded-xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider">
                    Day {day.dayNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {day.items?.length || 0} stops planned
                  </span>
                </div>

                <div className="space-y-3">
                  {day.items?.map((item, idx) => {
                    const catClass = CATEGORY_STYLES[(item.category || '').toLowerCase()] || CATEGORY_STYLES.culture;

                    return (
                      <div 
                        key={idx}
                        className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                          {idx + 1}
                        </div>

                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-slate-200/60 dark:border-slate-700"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="font-black text-xs text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 ml-1">
                              {item.costUSD > 0 ? `$${item.costUSD} USD` : 'Free'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {item.notes || item.description}
                          </p>

                          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 font-semibold text-slate-500">
                              <Clock size={11} /> {item.timeSlot || '~90 mins'}
                            </span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${catClass}`}>
                              {item.category || 'Sight'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Side: Interactive Leaflet Road Route Map (50%) */}
        <div className="w-full lg:w-1/2 h-[450px] lg:h-auto min-h-[450px] relative bg-slate-100 dark:bg-slate-950 p-4">
          <TripMapVisualizer
            itinerary={itinerary}
            activeDay={activeDay}
            onDayChange={setActiveDay}
            transportMode={itinerary.transportMode || 'Private Van'}
            routeColor="#2563eb"
            height="100%"
          />
        </div>

      </div>

      {/* Share Modal */}
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
}

