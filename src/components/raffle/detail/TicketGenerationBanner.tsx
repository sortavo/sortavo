import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, X } from 'lucide-react';
import { useTicketGenerationJob } from '@/hooks/useTicketGenerationJob';
import { getRafflePublicUrl } from '@/lib/url-utils';
import { cn } from '@/lib/utils';

interface TicketGenerationBannerProps {
  raffleId: string;
  raffleSlug: string;
  orgSlug?: string | null;
  justPublished?: boolean;
  onDismiss?: () => void;
}

export function TicketGenerationBanner({
  raffleId,
  raffleSlug,
  orgSlug,
  justPublished = false,
  onDismiss,
}: TicketGenerationBannerProps) {
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { job, isRunning, isComplete, isFailed, progress, error } = useTicketGenerationJob({
    onComplete: () => {
      setShowSuccessBanner(true);
    },
  });

  // For sync (small) raffles that complete immediately when justPublished
  useEffect(() => {
    if (justPublished && !job) {
      setShowSuccessBanner(true);
      // Auto-hide after 30 seconds
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [justPublished, job]);

  // Auto-hide success banner after 30 seconds
  useEffect(() => {
    if (showSuccessBanner) {
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessBanner]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowSuccessBanner(false);
    onDismiss?.();
  };

  if (dismissed) return null;

  const publicUrl = getRafflePublicUrl(raffleSlug, orgSlug);

  // Running state - show progress
  if (isRunning && job) {
    return (
      <Alert className="bg-amber-500/10 border-amber-500/30 mb-4">
        <div className="flex items-center gap-3 w-full">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
          <AlertDescription className="flex items-center justify-between flex-1 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium text-amber-700">
                Generando boletos...
              </span>
              <span className="text-xs text-amber-600">
                {job.generated_count.toLocaleString()} / {job.total_tickets.toLocaleString()}
              </span>
            </div>
            <Progress value={progress} className="w-24 h-2" />
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  // Error state
  if (isFailed) {
    return (
      <Alert className="bg-destructive/10 border-destructive/30 mb-4">
        <div className="flex items-center gap-3 w-full">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <AlertDescription className="flex items-center justify-between flex-1 gap-4">
            <span className="text-sm text-destructive">
              Error al generar boletos: {error || 'Error desconocido'}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={handleDismiss}
            >
              Cerrar
            </Button>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  // Success state - show for justPublished or when job completes
  if (showSuccessBanner || (justPublished && !isRunning)) {
    return (
      <Alert className="bg-emerald-500/10 border-emerald-500/30 mb-4">
        <div className="flex items-center gap-3 w-full">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <AlertDescription className="flex items-center justify-between flex-1 gap-2">
            <span className="text-sm font-medium text-emerald-700">
              ¡Tu rifa está activa y lista para recibir participantes!
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10 gap-1.5"
                asChild
              >
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver página
                </a>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return null;
}
