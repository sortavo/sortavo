import { useState, useEffect } from 'react';
import { differenceInHours, differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Flame, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UrgencyBadgeProps {
  drawDate: string;
  totalTickets: number;
  ticketsSold: number;
  className?: string;
}

export function UrgencyBadge({
  drawDate,
  totalTickets,
  ticketsSold,
  className
}: UrgencyBadgeProps) {
  const [now, setNow] = useState(new Date());

  // Update every minute for accurate countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const hoursUntilDraw = differenceInHours(new Date(drawDate), now);
  const minutesUntilDraw = differenceInMinutes(new Date(drawDate), now);
  const ticketsRemaining = totalTickets - ticketsSold;
  const percentageSold = (ticketsSold / totalTickets) * 100;

  // Show urgency conditions
  const showTimeUrgency = hoursUntilDraw < 24 && hoursUntilDraw > 0;
  const showLastMinutes = minutesUntilDraw <= 60 && minutesUntilDraw > 0;
  const showStockUrgency = percentageSold >= 90;
  const showLowStock = percentageSold >= 75 && percentageSold < 90;

  if (!showTimeUrgency && !showStockUrgency && !showLastMinutes && !showLowStock) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Time urgency - Last minutes */}
      {showLastMinutes && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-400 font-medium">
              ⏰ ¡Últimos {minutesUntilDraw} minutos para participar!
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Time urgency - Last hours */}
      {showTimeUrgency && !showLastMinutes && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <Clock className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-400 font-medium">
              ⏰ ¡Quedan solo {hoursUntilDraw} horas para participar!
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Stock urgency - Almost sold out */}
      {showStockUrgency && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
            <Flame className="w-4 h-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-400 font-medium">
              🔥 ¡Solo quedan {ticketsRemaining} boletos disponibles!
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Low stock warning */}
      {showLowStock && !showStockUrgency && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <AlertDescription className="text-orange-700 dark:text-orange-400 font-medium">
              ⚡ {Math.round(percentageSold)}% vendido - ¡Quedan {ticketsRemaining} boletos!
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}
