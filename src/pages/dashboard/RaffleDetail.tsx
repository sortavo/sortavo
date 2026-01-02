import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Clock, 
  BarChart3,
  Trophy,
  Pencil,
  MoreHorizontal,
  Link2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRaffles } from '@/hooks/useRaffles';
import { useAuth } from '@/hooks/useAuth';
import { OverviewTab } from '@/components/raffle/detail/OverviewTab';
import { TicketsTab } from '@/components/raffle/detail/TicketsTab';
import { BuyersTab } from '@/components/raffle/detail/BuyersTab';
import { ApprovalsTab } from '@/components/raffle/detail/ApprovalsTab';
import { AnalyticsTab } from '@/components/raffle/detail/AnalyticsTab';
import { ExportMenu } from '@/components/raffle/detail/ExportMenu';
import { RaffleDetailSkeleton } from '@/components/ui/skeletons';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageTransition } from '@/components/layout/PageTransition';

function RafflePublicLinks({ 
  orgSlug, 
  raffleSlug, 
  organizationId 
}: { 
  orgSlug?: string; 
  raffleSlug?: string; 
  organizationId?: string;
}) {
  const { data: customDomains } = useQuery({
    queryKey: ['custom-domains-for-raffle', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('custom_domains')
        .select('domain, is_primary')
        .eq('organization_id', organizationId!)
        .eq('verified', true)
        .order('is_primary', { ascending: false });
      return data;
    },
    enabled: !!organizationId
  });

  if (!orgSlug || !raffleSlug) return null;

  const sortavoUrl = `https://sortavo.com/${orgSlug}/${raffleSlug}`;
  const primaryCustomDomain = customDomains?.find(d => d.is_primary) || customDomains?.[0];
  const customDomainUrl = primaryCustomDomain 
    ? `https://${primaryCustomDomain.domain}/${raffleSlug}` 
    : null;

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {/* Sortavo link */}
      <div className="inline-flex items-center gap-1 group">
        <Link2 className="h-3 w-3 text-muted-foreground" />
        <a 
          href={sortavoUrl} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate max-w-[180px] sm:max-w-[250px]"
        >
          sortavo.com/{orgSlug}/{raffleSlug}
        </a>
        <button
          onClick={() => copyToClipboard(sortavoUrl)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
        >
          <Copy className="h-3 w-3 text-muted-foreground" />
        </button>
        <a 
          href={sortavoUrl} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Custom domain link */}
      {customDomainUrl && (
        <div className="inline-flex items-center gap-1 group">
          <Link2 className="h-3 w-3 text-emerald-600" />
          <a 
            href={customDomainUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-600 hover:underline truncate max-w-[180px] sm:max-w-[250px]"
          >
            {primaryCustomDomain?.domain}/{raffleSlug}
          </a>
          <button
            onClick={() => copyToClipboard(customDomainUrl)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
          >
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
          <a 
            href={customDomainUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export default function RaffleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const { useRaffleById, toggleRaffleStatus } = useRaffles();
  const { data: raffle, isLoading, error } = useRaffleById(id);


  if (isLoading) {
    return (
      <DashboardLayout>
        <RaffleDetailSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !raffle) {
    return (
      <DashboardLayout>
        <ErrorState
          title="Sorteo no encontrado"
          message="El sorteo que buscas no existe o fue eliminado."
          retry={() => navigate('/dashboard/raffles')}
        />
      </DashboardLayout>
    );
  }

  const handleToggleStatus = () => {
    toggleRaffleStatus.mutate({ 
      id: raffle.id, 
      currentStatus: raffle.status! 
    });
  };

  const tabs = [
    { value: 'overview', label: 'Resumen', icon: LayoutDashboard },
    { value: 'tickets', label: 'Boletos', icon: Ticket },
    { value: 'buyers', label: 'Compradores', icon: Users },
    { value: 'approvals', label: 'Aprobaciones', icon: Clock },
    { value: 'analytics', label: 'Analíticas', icon: BarChart3 },
  ];

  const canDraw = raffle.status === 'active' && 
                  raffle.tickets_sold > 0 && 
                  !raffle.winner_ticket_number &&
                  (role === 'owner' || role === 'admin');

  return (
    <DashboardLayout>
      <PageTransition>
      <div className="space-y-4 w-full max-w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button 
              variant="ghost" 
              size="icon"
              className="flex-shrink-0 h-8 w-8"
              onClick={() => navigate('/dashboard/raffles')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-2xl font-bold truncate">{raffle.title}</h1>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">{raffle.prize_name}</p>
                <RafflePublicLinks 
                  orgSlug={raffle.organization?.slug} 
                  raffleSlug={raffle.slug} 
                  organizationId={raffle.organization_id}
                />
              </div>
            </div>
            
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <ExportMenu raffleId={raffle.id} raffleName={raffle.title} />
              {canDraw && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => navigate(`/dashboard/raffles/${id}/draw`)}
                >
                  <Trophy className="h-4 w-4" />
                  Sortear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => navigate(`/dashboard/raffles/${id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </div>

            {/* Mobile/tablet actions dropdown */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/dashboard/raffles/${id}/edit`)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {canDraw && (
                    <DropdownMenuItem onClick={() => navigate(`/dashboard/raffles/${id}/draw`)}>
                      <Trophy className="h-4 w-4 mr-2" />
                      Sortear
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs - grid on mobile, inline on desktop */}
        <Tabs defaultValue="overview" className="space-y-4 w-full max-w-full min-w-0 overflow-hidden">
          <TabsList className="grid grid-cols-5 w-full h-auto gap-0.5 p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 px-1 md:px-2.5 py-2 text-[10px] md:text-sm min-w-0 overflow-hidden"
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-full block">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab 
              raffle={raffle} 
              onEdit={() => navigate(`/dashboard/raffles/${id}/edit`)}
              onToggleStatus={handleToggleStatus}
              isTogglingStatus={toggleRaffleStatus.isPending}
            />
          </TabsContent>

          <TabsContent value="tickets">
            <TicketsTab 
              raffleId={raffle.id} 
              raffleTitle={raffle.title} 
              raffleSlug={raffle.slug}
              rafflePrizeName={raffle.prize_name}
              rafflePrizeImages={raffle.prize_images || []}
              raffleDrawDate={raffle.draw_date}
              raffleTicketPrice={raffle.ticket_price}
              raffleCurrencyCode={raffle.currency_code || 'MXN'}
              organizationName={raffle.organization?.name || ''}
              organizationLogo={raffle.organization?.logo_url}
            />
          </TabsContent>

          <TabsContent value="buyers">
            <BuyersTab 
              raffleId={raffle.id}
              raffleTitle={raffle.title}
              raffleSlug={raffle.slug}
              prizeName={raffle.prize_name}
              prizeImages={raffle.prize_images || []}
              drawDate={raffle.draw_date}
              ticketPrice={raffle.ticket_price}
              currencyCode={raffle.currency_code || 'MXN'}
              organizationName={raffle.organization?.name || ''}
              organizationLogo={raffle.organization?.logo_url}
            />
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalsTab 
              raffleId={raffle.id} 
              raffleTitle={raffle.title} 
              raffleSlug={raffle.slug}
              ticketPrice={raffle.ticket_price}
              currencyCode={raffle.currency_code || 'MXN'}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab raffle={raffle} />
          </TabsContent>
        </Tabs>
      </div>
      </PageTransition>
    </DashboardLayout>
  );
}
