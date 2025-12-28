import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  XCircle, 
  MessageCircle, 
  Clock,
  User,
  Phone,
  Mail,
  Image,
  AlertCircle,
  Timer,
  ShieldAlert,
  Search,
  Package,
  ChevronDown,
  ChevronUp,
  Ticket,
  ExternalLink
} from 'lucide-react';
import { useTickets } from '@/hooks/useTickets';
import { useBuyers } from '@/hooks/useBuyers';
import { useEmails } from '@/hooks/useEmails';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ProtectedAction } from '@/components/auth/ProtectedAction';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { notifyPaymentApproved, notifyPaymentRejected } from '@/lib/notifications';

interface ApprovalsTabProps {
  raffleId: string;
  raffleTitle?: string;
  raffleSlug?: string;
}

interface OrderGroup {
  referenceCode: string;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  tickets: any[];
  reservedUntil: string | null;
  hasProof: boolean;
  proofUrl: string | null;
}

export function ApprovalsTab({ raffleId, raffleTitle = '', raffleSlug = '' }: ApprovalsTabProps) {
  const { role } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const { useTicketsList, approveTicket, rejectTicket, extendReservation, bulkApprove, bulkReject, approveByReference } = useTickets(raffleId);
  const { getWhatsAppLink } = useBuyers(raffleId);
  const { sendApprovedEmail, sendRejectedEmail, sendBulkApprovedEmail } = useEmails();
  
  const { data: ticketsData, isLoading, refetch } = useTicketsList({
    status: 'reserved',
    pageSize: 100,
  });

  const reservedTickets = ticketsData?.tickets || [];

  // Group tickets by reference code into orders
  const orderGroups = useMemo(() => {
    const groups: Record<string, OrderGroup> = {};
    
    reservedTickets.forEach(ticket => {
      const refCode = ticket.payment_reference || `no-ref-${ticket.id}`;
      
      if (!groups[refCode]) {
        groups[refCode] = {
          referenceCode: ticket.payment_reference || 'Sin código',
          buyerName: ticket.buyer_name,
          buyerPhone: ticket.buyer_phone,
          buyerEmail: ticket.buyer_email,
          tickets: [],
          reservedUntil: ticket.reserved_until,
          hasProof: !!ticket.payment_proof_url,
          proofUrl: ticket.payment_proof_url,
        };
      }
      
      groups[refCode].tickets.push(ticket);
      
      // Update proof status if any ticket has proof
      if (ticket.payment_proof_url) {
        groups[refCode].hasProof = true;
        groups[refCode].proofUrl = ticket.payment_proof_url;
      }
    });
    
    return Object.values(groups);
  }, [reservedTickets]);

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orderGroups;
    
    const query = searchQuery.toLowerCase().trim();
    return orderGroups.filter(order => 
      order.referenceCode.toLowerCase().includes(query) ||
      order.buyerName?.toLowerCase().includes(query) ||
      order.buyerPhone?.includes(query) ||
      order.buyerEmail?.toLowerCase().includes(query) ||
      order.tickets.some(t => t.ticket_number?.toLowerCase().includes(query))
    );
  }, [orderGroups, searchQuery]);

  // Split orders by payment proof
  const ordersWithoutProof = filteredOrders.filter(o => !o.hasProof);
  const ordersWithProof = filteredOrders.filter(o => o.hasProof);

  const getTimeRemaining = (reservedUntil: string | null) => {
    if (!reservedUntil) return null;
    const remaining = new Date(reservedUntil).getTime() - Date.now();
    if (remaining <= 0) return 'Expirado';
    
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleApproveOrder = async (order: OrderGroup) => {
    const ticketIds = order.tickets.map(t => t.id);
    const ticketNumbers = order.tickets.map(t => t.ticket_number);
    
    try {
      await bulkApprove.mutateAsync(ticketIds);
      toast({ 
        title: `${ticketIds.length} boletos aprobados`,
        description: `Pedido ${order.referenceCode}`,
      });
      
      // Send notification
      if (order.buyerEmail && order.buyerName) {
        sendBulkApprovedEmail({
          to: order.buyerEmail,
          buyerName: order.buyerName,
          ticketNumbers,
          raffleTitle,
          raffleSlug,
          referenceCode: order.referenceCode,
        }).catch(console.error);
        
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', order.buyerEmail)
          .maybeSingle();
        
        if (buyerProfile?.id) {
          notifyPaymentApproved(
            buyerProfile.id,
            raffleTitle,
            ticketNumbers
          ).catch(console.error);
        }
      }
      
      refetch();
    } catch (error) {
      toast({ title: 'Error al aprobar', variant: 'destructive' });
    }
  };

  const handleRejectOrder = async (order: OrderGroup) => {
    const ticketIds = order.tickets.map(t => t.id);
    const ticketNumbers = order.tickets.map(t => t.ticket_number);
    
    try {
      await bulkReject.mutateAsync(ticketIds);
      toast({ 
        title: `${ticketIds.length} boletos rechazados`,
        description: `Pedido ${order.referenceCode}`,
      });
      
      // Send notification
      if (order.buyerEmail && order.buyerName) {
        sendRejectedEmail({
          to: order.buyerEmail,
          buyerName: order.buyerName,
          ticketNumbers,
          raffleTitle,
          raffleSlug,
          rejectionReason: 'El pago no fue verificado correctamente',
        }).catch(console.error);
        
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', order.buyerEmail)
          .maybeSingle();
        
        if (buyerProfile?.id) {
          notifyPaymentRejected(
            buyerProfile.id,
            raffleTitle,
            ticketNumbers,
            'El pago no fue verificado correctamente'
          ).catch(console.error);
        }
      }
      
      refetch();
    } catch (error) {
      toast({ title: 'Error al rechazar', variant: 'destructive' });
    }
  };

  const handleExtendOrder = async (order: OrderGroup) => {
    try {
      // Extend all tickets in the order
      for (const ticket of order.tickets) {
        await extendReservation.mutateAsync({ ticketId: ticket.id, minutes: 30 });
      }
      toast({ title: `Reservación extendida 30 minutos para ${order.tickets.length} boletos` });
      refetch();
    } catch (error) {
      toast({ title: 'Error al extender', variant: 'destructive' });
    }
  };

  const toggleOrderExpanded = (refCode: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(refCode)) {
        next.delete(refCode);
      } else {
        next.add(refCode);
      }
      return next;
    });
  };

  const OrderCard = ({ order, showProof }: { order: OrderGroup; showProof: boolean }) => {
    const timeRemaining = getTimeRemaining(order.reservedUntil);
    const isExpired = timeRemaining === 'Expirado';
    const isExpanded = expandedOrders.has(order.referenceCode);
    const ticketCount = order.tickets.length;

    return (
      <Card className={cn(
        'transition-all',
        isExpired && 'border-destructive/50'
      )}>
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                showProof ? "bg-yellow-500/10" : "bg-destructive/10"
              )}>
                <Package className={cn(
                  "h-5 w-5",
                  showProof ? "text-yellow-600" : "text-destructive"
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{order.referenceCode}</span>
                  <Badge variant="secondary" className="font-mono">
                    {ticketCount} boleto{ticketCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  isExpired ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  <Timer className="h-3 w-3" />
                  <span>{timeRemaining || 'Sin fecha'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {order.buyerName && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{order.buyerName}</span>
              </div>
            )}
            {order.buyerPhone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{order.buyerPhone}</span>
              </div>
            )}
            {order.buyerEmail && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{order.buyerEmail}</span>
              </div>
            )}
          </div>

          {/* Ticket Numbers - Collapsible */}
          <Collapsible open={isExpanded} onOpenChange={() => toggleOrderExpanded(order.referenceCode)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between px-3 py-2 h-auto">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {ticketCount <= 6 
                      ? order.tickets.map(t => `#${t.ticket_number}`).join(', ')
                      : `${order.tickets.slice(0, 4).map(t => `#${t.ticket_number}`).join(', ')} +${ticketCount - 4} más`
                    }
                  </span>
                </div>
                {ticketCount > 6 && (
                  isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex flex-wrap gap-1.5 px-3">
                {order.tickets.map(ticket => (
                  <Badge 
                    key={ticket.id} 
                    variant="outline" 
                    className="font-mono text-xs"
                  >
                    #{ticket.ticket_number}
                  </Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Payment Proof */}
          {showProof && order.proofUrl && (
            <div className="relative">
              <a 
                href={order.proofUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block relative aspect-video max-h-48 rounded-md overflow-hidden bg-muted group"
              >
                <img 
                  src={order.proofUrl} 
                  alt="Comprobante de pago" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
              </a>
            </div>
          )}

          {!showProof && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Sin comprobante de pago
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="default"
              onClick={() => handleApproveOrder(order)}
              disabled={bulkApprove.isPending}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Aprobar {ticketCount > 1 ? `(${ticketCount})` : ''}
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleRejectOrder(order)}
              disabled={bulkReject.isPending}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Rechazar {ticketCount > 1 ? `(${ticketCount})` : ''}
            </Button>
            {order.buyerPhone && (
              <Button 
                size="icon" 
                variant="outline"
                asChild
                className="shrink-0"
              >
                <a 
                  href={getWhatsAppLink(order.buyerPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Contactar por WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button 
              size="icon" 
              variant="outline"
              onClick={() => handleExtendOrder(order)}
              disabled={extendReservation.isPending}
              title="Extender reservación 30 min"
              className="shrink-0"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((j) => (
                <div key={j} className="h-48 bg-muted animate-pulse rounded" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <ProtectedAction
      resource="ticket"
      action="approve"
      showAlert
      fallback={
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Solo administradores pueden aprobar pagos. Contacta al propietario de la organización.
          </AlertDescription>
        </Alert>
      }
    >
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nombre, teléfono o boleto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Badge variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2">
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{orderGroups.length} pedido{orderGroups.length !== 1 ? 's' : ''} pendiente{orderGroups.length !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{reservedTickets.length} boleto{reservedTickets.length !== 1 ? 's' : ''} total</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Without Proof Column */}
          <div className="space-y-4">
            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Sin Comprobante ({ordersWithoutProof.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ordersWithoutProof.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay pedidos sin comprobante</p>
                  </div>
                ) : (
                  ordersWithoutProof.map((order) => (
                    <OrderCard
                      key={order.referenceCode}
                      order={order}
                      showProof={false}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* With Proof Column */}
          <div className="space-y-4">
            <Card className="border-yellow-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-600">
                  <Image className="h-5 w-5" />
                  Con Comprobante ({ordersWithProof.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ordersWithProof.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay comprobantes pendientes</p>
                  </div>
                ) : (
                  ordersWithProof.map((order) => (
                    <OrderCard
                      key={order.referenceCode}
                      order={order}
                      showProof={true}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedAction>
  );
}
