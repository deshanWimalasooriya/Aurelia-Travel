import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Copy, Check, Share2, Globe, Sparkles, Send, MessageCircle 
} from 'lucide-react';
import Button from '../common/Button';

/**
 * ShareTripModal (`ShareTripModal.jsx`)
 * 
 * Glassmorphic share modal providing 1-click public link copying, social sharing triggers,
 * and visual copy confirmations for saved smart plan itineraries.
 */
export default function ShareTripModal({
  isOpen,
  onClose,
  shareUuid,
  tripTitle = 'Aurelia Smart Plan',
  destinationCity = 'Sri Lanka',
  onCopiedToast
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aureliatravel.com';
  const shareUrl = shareUuid ? `${origin}/trip/share/${shareUuid}` : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl);
    } else {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }

    setCopied(true);
    if (onCopiedToast) {
      onCopiedToast('Public trip link copied to clipboard!');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tripTitle,
          text: `Check out my customized Sri Lankan travel itinerary for ${destinationCity} on Aurelia Travel!`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share blocked
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out my customized travel plan for ${destinationCity} on Aurelia Travel: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10 p-6 flex flex-col space-y-4 text-slate-900 dark:text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-extrabold uppercase tracking-wider mb-1">
                <Globe size={12} />
                <span>Public Share Link</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Share Your Itinerary
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Anyone with this link can view the road routes and clone it into their plan.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Copyable Link Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Shareable Public URL
            </label>
            
            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 shadow-inner">
              <input
                type="text"
                readOnly
                value={shareUrl || 'Generating public share link...'}
                className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-300 font-mono outline-none select-all truncate"
                onClick={(e) => e.target.select()}
              />

              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!shareUrl}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-sm ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Share Options */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Instant Share Channels
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 size={15} />
                <span>More Options</span>
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-[11px]">
              <Sparkles size={12} className="text-amber-500" />
              <span>Includes full road routes & stops</span>
            </span>

            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Done
            </Button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

