import { motion } from "framer-motion";
import { Sparkles, Star, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LuckyNumberBadgeProps {
  type: 'lucky' | 'popular' | 'hot' | 'last';
  className?: string;
}

const badgeConfig = {
  lucky: {
    icon: Sparkles,
    label: 'Suerte',
    colors: 'bg-yellow-400 text-yellow-900',
    glow: 'shadow-yellow-400/50',
  },
  popular: {
    icon: Star,
    label: 'Popular',
    colors: 'bg-blue-500 text-white',
    glow: 'shadow-blue-500/50',
  },
  hot: {
    icon: Flame,
    label: 'Hot',
    colors: 'bg-orange-500 text-white',
    glow: 'shadow-orange-500/50',
  },
  last: {
    icon: Zap,
    label: 'Último',
    colors: 'bg-red-500 text-white',
    glow: 'shadow-red-500/50',
  },
};

export function LuckyNumberBadge({ type, className }: LuckyNumberBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      className={cn(
        "absolute -top-1 -right-1 z-10",
        "w-5 h-5 rounded-full",
        "flex items-center justify-center",
        "shadow-lg",
        config.colors,
        config.glow,
        className
      )}
    >
      <Icon className="w-3 h-3" />
    </motion.div>
  );
}

// Utility to determine if a number should have a badge
export function getNumberBadgeType(
  ticketNumber: string,
  luckyNumbers: string[] = [],
  popularNumbers: string[] = [],
  lastFewAvailable: boolean = false
): 'lucky' | 'popular' | 'hot' | 'last' | null {
  if (luckyNumbers.includes(ticketNumber)) return 'lucky';
  if (popularNumbers.includes(ticketNumber)) return 'popular';
  if (lastFewAvailable) return 'last';
  
  // Check for "hot" patterns (repeating digits, sequences, etc.)
  const num = parseInt(ticketNumber, 10);
  const str = ticketNumber.replace(/^0+/, '');
  
  // Repeating digits (111, 222, 777, etc.)
  if (str.length >= 2 && new Set(str.split('')).size === 1) return 'hot';
  
  // Lucky 7s
  if (str.includes('777')) return 'hot';
  
  // Round numbers ending in 00
  if (num % 100 === 0 && num > 0) return 'popular';
  
  return null;
}
