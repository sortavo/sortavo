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
    <Card className="relative bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-2xl shadow-emerald-500/10">
      {/* TIER S: Multiple animated orbs background */}
      <motion.div 
        className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"
        animate={{ 
          x: [0, 20, 0], 
          y: [0, -15, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-teal-500/8 rounded-full blur-[120px] pointer-events-none"
        animate={{ 
          x: [0, -15, 0], 
          y: [0, 20, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />
      
      <CardContent className="relative pt-10 pb-10 space-y-10">
        {/* Header - TIER S Premium style with w-20 h-20 icon */}
        <div className="text-center">
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <BarChart3 className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Tus Probabilidades</h3>
          <p className="text-base text-white/50 mt-2">Estadísticas en tiempo real</p>
        </div>

        {/* Main probability - TIER S Dramatic number */}
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 border border-white/[0.08] hover:border-emerald-500/20 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Target className="w-7 h-7 text-emerald-400" />
              </div>
              <span className="font-semibold text-white/80 text-lg">Probabilidad por boleto</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10 text-sm px-4 py-2">
              1 de {ticketsAvailable.toLocaleString()}
            </Badge>
          </div>
          
          <div className="text-center py-6">
            <motion.span 
              className="text-6xl lg:text-7xl font-black text-emerald-400 tracking-[-0.04em]"
              key={stats.probabilityPerTicket}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {stats.probabilityPerTicket.toFixed(2)}%
            </motion.span>
          </div>
        </div>

        {/* Progress bar - tickets sold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-base">
            <span className="text-white/60">Boletos vendidos</span>
            <span className="font-bold text-white text-lg">
              {ticketsSold.toLocaleString()} / {totalTickets.toLocaleString()}
            </span>
          </div>
          <Progress value={stats.soldPercentage} className="h-4 bg-white/[0.06] [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-emerald-400" />
          <p className="text-sm text-white/40 text-center">
            {ticketsAvailable.toLocaleString()} boletos disponibles
          </p>
        </div>

        {/* Comparison badge - TIER S with shimmer */}
        {stats.timesMoreLikely > 1000 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 shimmer-badge"
          >
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span className="text-base font-semibold text-amber-400">
              {stats.timesMoreLikely.toLocaleString()}× más probable que la lotería nacional
            </span>
          </motion.div>
        )}

        {/* Package multipliers - TIER S Premium cards with hover glow */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
            <span className="font-semibold text-white/80 text-lg">Aumenta tus probabilidades</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {packageMultipliers.map((pkg) => {
              const pkgProbability = ticketsAvailable > 0 ? (pkg.qty / ticketsAvailable) * 100 : 0;
              const cost = pkg.qty * ticketPrice;
              
              return (
                <div 
                  key={pkg.qty}
                  className="text-center p-6 bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-3">
                    <Ticket className="w-4 h-4 text-white/40 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-sm text-white/50">{pkg.label}</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-black text-emerald-400 tracking-tight">
                    {pkgProbability.toFixed(2)}%
                  </p>
                  <p className="text-sm text-white/40 mt-2">
                    {formatCurrency(cost, currencyCode)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected tickets probability - TIER S Premium emerald gradient with glow */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white shadow-2xl shadow-emerald-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base opacity-90">Con tus {selectedCount} boletos</p>
                <p className="text-4xl lg:text-5xl font-black tracking-[-0.04em]">
                  {stats.probabilityWithSelection.toFixed(2)}% de ganar
                </p>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-10 h-10" />
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
