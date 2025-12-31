import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/currency-utils";
import { 
  TrendingUp, 
  Target, 
  Ticket,
  Sparkles,
  BarChart3
} from "lucide-react";

interface ProbabilityStatsProps {
  totalTickets: number;
  ticketsSold: number;
  ticketsAvailable: number;
  ticketPrice: number;
  currencyCode: string;
  selectedCount?: number;
}

export function ProbabilityStats({
  totalTickets,
  ticketsSold,
  ticketsAvailable,
  ticketPrice,
  currencyCode,
  selectedCount = 0
}: ProbabilityStatsProps) {
  const stats = useMemo(() => {
    const probabilityPerTicket = ticketsAvailable > 0 ? (1 / ticketsAvailable) * 100 : 0;
    const probabilityWithSelection = ticketsAvailable > 0 ? (selectedCount / ticketsAvailable) * 100 : 0;
    const soldPercentage = (ticketsSold / totalTickets) * 100;
    
    // Compare to national lottery (approximately 1 in 10 million)
    const nationalLotteryOdds = 1 / 10000000;
    const raffleOdds = ticketsAvailable > 0 ? 1 / ticketsAvailable : 0;
    const timesMoreLikely = raffleOdds > 0 ? Math.round(raffleOdds / nationalLotteryOdds) : 0;
    
    return {
      probabilityPerTicket,
      probabilityWithSelection,
      soldPercentage,
      timesMoreLikely
    };
  }, [totalTickets, ticketsSold, ticketsAvailable, selectedCount]);

  const packageMultipliers = [
    { qty: 3, label: "3 boletos" },
    { qty: 5, label: "5 boletos" },
    { qty: 10, label: "10 boletos" }
  ];

  return (
    <Card className="relative bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-2xl shadow-emerald-500/5">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
      
      <CardContent className="relative pt-8 pb-8 space-y-8">
        {/* Header - Premium style */}
        <div className="text-center">
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <BarChart3 className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-xl font-bold text-white tracking-tight">Tus Probabilidades</h3>
          <p className="text-sm text-white/50 mt-1">Estadísticas en tiempo real</p>
        </div>

        {/* Main probability - Dramatic number */}
        <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-medium text-white/80">Probabilidad por boleto</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              1 de {ticketsAvailable.toLocaleString()}
            </Badge>
          </div>
          
          <div className="text-center py-4">
            <motion.span 
              className="text-5xl font-black text-emerald-400 tracking-tight"
              key={stats.probabilityPerTicket}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {stats.probabilityPerTicket.toFixed(2)}%
            </motion.span>
          </div>
        </div>

        {/* Progress bar - tickets sold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Boletos vendidos</span>
            <span className="font-semibold text-white">
              {ticketsSold.toLocaleString()} / {totalTickets.toLocaleString()}
            </span>
          </div>
          <Progress value={stats.soldPercentage} className="h-3 bg-white/[0.06] [&>div]:bg-emerald-500" />
          <p className="text-xs text-white/40 text-center">
            {ticketsAvailable.toLocaleString()} boletos disponibles
          </p>
        </div>

        {/* Comparison badge */}
        {stats.timesMoreLikely > 1000 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              {stats.timesMoreLikely.toLocaleString()}× más probable que la lotería nacional
            </span>
          </motion.div>
        )}

        {/* Package multipliers - Premium cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-medium text-white/80">Aumenta tus probabilidades</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {packageMultipliers.map((pkg) => {
              const pkgProbability = ticketsAvailable > 0 ? (pkg.qty / ticketsAvailable) * 100 : 0;
              const cost = pkg.qty * ticketPrice;
              
              return (
                <div 
                  key={pkg.qty}
                  className="text-center p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Ticket className="w-3 h-3 text-white/40 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-xs text-white/50">{pkg.label}</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">
                    {pkgProbability.toFixed(2)}%
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {formatCurrency(cost, currencyCode)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected tickets probability - Premium emerald gradient */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white shadow-xl shadow-emerald-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Con tus {selectedCount} boletos</p>
                <p className="text-3xl font-black tracking-tight">
                  {stats.probabilityWithSelection.toFixed(2)}% de ganar
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-7 h-7" />
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
