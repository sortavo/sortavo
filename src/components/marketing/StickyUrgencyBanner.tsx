import { useState, useEffect } from 'react';
import { differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Flame } from 'lucide-react';

interface StickyUrgencyBannerProps {
  drawDate: string;
  totalTickets: number;
  ticketsSold: number;
  onScrollToTickets: () => void;
}

export function StickyUrgencyBanner({
  drawDate,
  totalTickets,
  ticketsSold,
  onScrollToTickets
}: StickyUrgencyBannerProps) {
  const [now, setNow] = useState(new Date());
  const [dismissed, setDismissed] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Update every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hoursUntilDraw = differenceInHours(new Date(drawDate), now);
  const minutesUntilDraw = differenceInMinutes(new Date(drawDate), now) % 60;
  const secondsUntilDraw = differenceInSeconds(new Date(drawDate), now) % 60;
  const ticketsRemaining = totalTickets - ticketsSold;
  const percentageSold = (ticketsSold / totalTickets) * 100;

  // Show conditions: < 12 hours remaining OR < 10% tickets left
  const showTimeUrgency = hoursUntilDraw < 12 && hoursUntilDraw >= 0;
  const showStockUrgency = percentageSold >= 90;
  const shouldShow = (showTimeUrgency || showStockUrgency) && hasScrolled && !dismissed;

  if (!shouldShow) return null;

  const formatTime = (h: number, m: number, s: number) => {
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className={`
          py-3 px-4 text-center text-white
          ${showStockUrgency 
            ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500' 
            : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500'}
        `}>
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 relative">
            <button 
              onClick={() => setDismissed(true)}
              className="absolute left-0 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              {showStockUrgency ? (
                <>
                  <Flame className="w-5 h-5 animate-pulse" />
                  <span className="font-bold">
                    🔥 ¡Solo quedan {ticketsRemaining} boletos!
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  <span className="font-bold">
                    ⏰ El sorteo cierra en: {formatTime(hoursUntilDraw, minutesUntilDraw, secondsUntilDraw)}
                  </span>
                </>
              )}
              
              <button
                onClick={onScrollToTickets}
                className="px-4 py-1.5 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Comprar Ahora
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
