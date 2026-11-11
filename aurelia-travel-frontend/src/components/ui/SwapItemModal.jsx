import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, RefreshCw, Star, MapPin, Clock, 
  ArrowDown, ArrowUp, Check, Sparkles, BedDouble, Camera 
} from 'lucide-react';
import axios from 'axios';
import SkeletonCard from './SkeletonCard';
import Button from '../common/Button';

// ============================================================================
// CURATED SRI LANKAN ALTERNATIVES (Reliable Fallback Catalog)
// ============================================================================
const FALLBACK_ALTERNATIVES = {
  hotel: [
    {
      reference_id: 801,
      id: 801,
      name: "Earl's Regency 5-Star Sanctuary",
      type: "hotel",
      rating: 4.9,
      costUSD: 85,
      pricePerNightUSD: 85,
      city: "Kandy",
      latitude: 7.2912,
      longitude: 80.6550,
      image_url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
      description: "Nestled amidst the hills with river views, luxury spa, and panoramic infinity pool."
    },
    {
      reference_id: 802,
      id: 802,
      name: "Cinnamon Citadel Riverside Resort",
      type: "hotel",
      rating: 4.7,
      costUSD: 65,
      pricePerNightUSD: 65,
      city: "Kandy",
      latitude: 7.3050,
      longitude: 80.6210,
      image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
      description: "Picturesque riverside resort overlooking the Mahaweli River with traditional Kandyan architecture."
    },
    {
      reference_id: 803,
      id: 803,
      name: "Amaya Hills Mountain Retreat",
      type: "hotel",
      rating: 4.8,
      costUSD: 70,
      pricePerNightUSD: 70,
      city: "Kandy",
      latitude: 7.2550,
      longitude: 80.6050,
      image_url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
      description: "Breathtaking hilltop haven styled after ancient Kandyan palaces with stunning valley panoramas."
    },
    {
      reference_id: 804,
      id: 804,
      name: "The Grand Hotel Ella Pass",
      type: "hotel",
      rating: 4.6,
      costUSD: 55,
      pricePerNightUSD: 55,
      city: "Ella",
      latitude: 6.8720,
      longitude: 81.0480,
      image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      description: "Cozy boutique mountain lodge perched right at the edge of the scenic Ella gap."
    }
  ],
  place: [
    {
      reference_id: 811,
      id: 811,
      name: "Bahirawakanda Vihara Buddha Statue",
      type: "place",
      category: "Culture",
      rating: 4.8,
      costUSD: 3,
      durationMins: 60,
      city: "Kandy",
      latitude: 7.2917,
      longitude: 80.6300,
      image_url: "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=600&q=80",
      notes: "Towering 88-foot white Buddha statue overlooking the entire Kandy valley and sacred lake."
    },
    {
      reference_id: 812,
      id: 812,
      name: "Udawatta Kele Royal Forest Reserve",
      type: "place",
      category: "Nature",
      rating: 4.7,
      costUSD: 5,
      durationMins: 90,
      city: "Kandy",
      latitude: 7.2980,
      longitude: 80.6420,
      image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
      notes: "Historic kingdom sanctuary teeming with endemic birdlife, giant lianas, and secluded walking trails."
    },
    {
      reference_id: 813,
      id: 813,
      name: "Ceylon Tea Museum & Vintage Factory",
      type: "place",
      category: "History",
      rating: 4.6,
      costUSD: 6,
      durationMins: 90,
      city: "Kandy",
      latitude: 7.2625,
      longitude: 80.6250,
      image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80",
      notes: "1925 historic tea factory showcasing pioneer machinery and artisanal tea tasting sessions."
    },
    {
      reference_id: 814,
      id: 814,
      name: "Diyaluma Waterfall & Upper Natural Pools",
      type: "place",
      category: "Adventure",
      rating: 4.9,
      costUSD: 0,
      durationMins: 180,
      city: "Ella",
      latitude: 6.7327,
      longitude: 81.0315,
      image_url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80",
      notes: "Sri Lanka's 2nd highest waterfall featuring multi-tier natural infinity cliff pools."
    }
  ]
};

/**
 * Smart Swap Modal (`SwapItemModal.jsx`)
 * 
 * Provides dynamic replacement of hotels or attractions with live price difference badges,
 * skeleton loading states, and instant synchronization with the parent itinerary.
 */
export default function SwapItemModal({
  isOpen,
  onClose,
  targetItem,
  targetDayNumber,
  destinationCity = 'Kandy',
  onSelectAlternative,
  currentTripBudget = 300
}) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const isHotel = targetItem?.type === 'hotel';
  const targetCost = Number(targetItem?.pricePerNightUSD ?? targetItem?.costUSD ?? 0);

  // Fetch alternatives whenever modal opens or target changes
  useEffect(() => {
    if (!isOpen || !targetItem) return;

    let isMounted = true;
    setLoading(true);
    setSelectedId(null);

    const fetchAlternatives = async () => {
      const city = destinationCity || targetItem.city || 'Kandy';
      const type = isHotel ? 'hotel' : 'place';
      const currentId = targetItem.reference_id || targetItem.id;

      try {
        const res = await axios.get('http://localhost:5000/api/smart-plan/alternatives', {
          params: {
            city,
            type,
            excludeIds: currentId ? `${currentId}` : '',
            maxPrice: currentTripBudget
          },
          timeout: 3500
        });

        if (isMounted) {
          if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
            setAlternatives(res.data.data);
          } else {
            // Curated fallback
            const pool = isHotel ? FALLBACK_ALTERNATIVES.hotel : FALLBACK_ALTERNATIVES.place;
            setAlternatives(pool.filter(p => p.reference_id !== currentId));
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('API alternatives fetch notice, using fallback catalog:', err.message);
          const pool = isHotel ? FALLBACK_ALTERNATIVES.hotel : FALLBACK_ALTERNATIVES.place;
          setAlternatives(pool.filter(p => p.reference_id !== currentId));
          setLoading(false);
        }
      }
    };

    // Minor debounce/smooth entrance
    const timer = setTimeout(fetchAlternatives, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, targetItem, destinationCity, isHotel, currentTripBudget]);

  if (!isOpen || !targetItem) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        
        {/* Backdrop dismiss */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-850/40">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-extrabold uppercase tracking-wider mb-1">
                <Sparkles size={12} />
                <span>Smart Plan Swapper</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Swap {isHotel ? 'Accommodation' : 'Timeline Activity'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Currently replacing: <strong className="text-slate-800 dark:text-slate-200">{targetItem.name}</strong> 
                <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                  (${targetCost} {isHotel ? '/ night' : 'USD'})
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            
            {loading ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Scanning verified Sri Lankan stays & activities nearby...</span>
                </div>
                {/* Render SkeletonCard placeholders matching HotelCard structure */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>
            ) : alternatives.length > 0 ? (
              <div className="grid grid-cols-1 gap-3.5">
                {alternatives.map((alt, index) => {
                  const altCost = Number(alt.costUSD ?? alt.pricePerNightUSD ?? 0);
                  const priceDiff = altCost - targetCost;
                  const isSelected = selectedId === (alt.reference_id || alt.id || index);

                  return (
                    <motion.div
                      key={alt.reference_id || alt.id || index}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedId(alt.reference_id || alt.id || index)}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start gap-4 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/30' 
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-400/80 hover:bg-white dark:hover:bg-slate-800/80'
                      }`}
                    >
                      {/* Thumbnail Image */}
                      {alt.image_url && (
                        <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                          <img 
                            src={alt.image_url} 
                            alt={alt.name} 
                            className="w-full h-full object-cover" 
                          />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-sm">
                            {isHotel ? 'Stay' : alt.category || 'Sight'}
                          </span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                              {alt.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1 font-semibold">
                                <MapPin size={11} className="text-blue-500" />
                                {alt.city || destinationCity}
                              </span>
                              {alt.rating && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-bold text-amber-500">
                                    <Star size={11} className="fill-amber-500" />
                                    {alt.rating}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Price Difference Badge */}
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              ${altCost} {isHotel ? '/nt' : 'USD'}
                            </span>
                            
                            {priceDiff < 0 ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                                <ArrowDown size={10} />
                                -${Math.abs(priceDiff)} {isHotel ? '/nt' : ''} cheaper
                              </span>
                            ) : priceDiff > 0 ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800">
                                <ArrowUp size={10} />
                                +${priceDiff} {isHotel ? '/nt' : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                Same price
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                          {alt.description || alt.notes || "Authentic Sri Lankan experience with top guest ratings."}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={11} />
                            {alt.durationMins ? `~${alt.durationMins} mins visit` : 'Flexible duration'}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAlternative(alt, targetDayNumber);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 shadow-sm shadow-blue-500/25 cursor-pointer"
                          >
                            <Check size={13} />
                            <span>Select Alternative</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2 text-slate-400">
                <p className="text-sm font-bold">No alternate items found for this specific filter.</p>
                <p className="text-xs">Try increasing the budget or exploring a nearby city.</p>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/40">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Swapping updates budget & road routing instantly.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

