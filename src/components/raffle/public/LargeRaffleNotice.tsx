import { AlertTriangle, Search, Shuffle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface LargeRaffleNoticeProps {
  totalTickets: number;
  onUseSearch: () => void;
  onUseRandom: () => void;
}

const LARGE_RAFFLE_THRESHOLD = 50000;

export function LargeRaffleNotice({ 
  totalTickets, 
  onUseSearch, 
  onUseRandom 
}: LargeRaffleNoticeProps) {
  if (totalTickets <= LARGE_RAFFLE_THRESHOLD) return null;

  const formattedCount = new Intl.NumberFormat('es-MX').format(totalTickets);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-amber-900">
                ¡{formattedCount} boletos disponibles!
              </h3>
              <p className="text-amber-700 max-w-md">
                Esta es una rifa muy grande. Para una mejor experiencia, 
                te recomendamos usar la <strong>búsqueda</strong> para encontrar 
                números específicos o la <strong>selección aleatoria</strong> para 
                dejar que la suerte elija por ti.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
              <Button
                onClick={onUseSearch}
                variant="outline"
                className="flex-1 h-12 border-2 border-amber-300 bg-white hover:bg-amber-100 text-amber-900"
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar número
              </Button>
              <Button
                onClick={onUseRandom}
                className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Elegir al azar
              </Button>
            </div>

            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              La vista de cuadrícula muestra máximo 10,000 boletos por página
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { LARGE_RAFFLE_THRESHOLD };
