import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier?: string;
  currentLimit?: number;
  requestedValue?: number;
  feature?: string;
}

export const UpgradePlanModal = ({ 
  open, 
  onOpenChange, 
  currentTier = 'basic',
  currentLimit,
  requestedValue,
  feature = 'boletos'
}: UpgradePlanModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Actualiza tu Plan
          </DialogTitle>
          <DialogDescription>
            {currentLimit && requestedValue 
              ? 'Has alcanzado el límite de tu plan actual'
              : 'Desbloquea más funcionalidades con un plan superior'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentLimit && requestedValue && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>{feature}:</strong> Tu plan actual permite hasta <strong>{currentLimit.toLocaleString()}</strong>, 
                pero intentas usar <strong>{requestedValue.toLocaleString()}</strong>.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 border rounded-lg hover:border-primary transition-colors cursor-pointer ${currentTier === 'pro' ? 'border-primary bg-primary/5' : ''}`}>
              <Zap className="w-8 h-8 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">Plan Pro</p>
                <p className="text-sm text-muted-foreground">Hasta 50,000 boletos • 20 sorteos activos</p>
              </div>
              <span className="font-bold">$149/mes</span>
            </div>

            <div className={`flex items-center gap-3 p-3 border rounded-lg hover:border-primary transition-colors cursor-pointer ${currentTier === 'premium' ? 'border-primary bg-primary/5' : ''}`}>
              <Star className="w-8 h-8 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium">Plan Premium</p>
                <p className="text-sm text-muted-foreground">Hasta 100,000 boletos • Sorteos ilimitados</p>
              </div>
              <span className="font-bold">$299/mes</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={() => navigate('/onboarding?step=3')} className="flex-1">
            Ver Planes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};