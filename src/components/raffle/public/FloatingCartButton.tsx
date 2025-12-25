import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency-utils";
import { ShoppingCart, ArrowRight, Ticket, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingCartButtonProps {
  selectedCount: number;
  total: number;
  currency: string;
  selectedTickets: string[];
  onContinue: () => void;
  onClear: () => void;
}

export function FloatingCartButton({
  selectedCount,
  total,
  currency,
  selectedTickets,
  onContinue,
  onClear,
}: FloatingCartButtonProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600" />
          
          <div className="p-4">
            {/* Header with ticket count */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                  {/* Count badge */}
                  <motion.div
                    key={selectedCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                  >
                    {selectedCount}
                  </motion.div>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedCount} boleto{selectedCount !== 1 && 's'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedTickets.slice(0, 3).join(', ')}
                    {selectedCount > 3 && ` +${selectedCount - 3} más`}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClear}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Limpiar selección"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Price and CTA */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-500">Total</p>
                <motion.p
                  key={total}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"
                >
                  {formatCurrency(total, currency)}
                </motion.p>
              </div>
              
              <Button
                onClick={onContinue}
                size="lg"
                className={cn(
                  "flex-1 bg-gradient-to-r from-violet-600 to-indigo-600",
                  "hover:from-violet-700 hover:to-indigo-700",
                  "shadow-lg shadow-violet-500/30",
                  "h-14 text-base font-semibold",
                  "group transition-all"
                )}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Continuar
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
