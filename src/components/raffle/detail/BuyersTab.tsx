import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  Search, 
  Download,
  MessageCircle,
  Mail,
  ChevronLeft,
  ChevronRight,
  Users,
  Eye,
  FileDown,
  Image,
  Copy,
  DollarSign,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { useBuyers } from '@/hooks/useBuyers';
import { Buyer, PaymentMethod } from '@/types/raffle';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/currency';
import { exportBuyersToExcel, exportBuyersToPDF } from '@/lib/exportBuyers';
import { TicketDetailDialog } from './TicketDetailDialog';

interface BuyersTabProps {
  raffleId: string;
  raffleName: string;
  currencyCode: string;
}

interface SummaryStats {
  totalRevenue: number;
  avgPerBuyer: number;
  pendingCount: number;
  confirmedCount: number;
}

export function BuyersTab({ raffleId, raffleName, currencyCode }: BuyersTabProps) {
  const { toast } = useToast();
  const { buyers, isLoading } = useBuyers(raffleId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const itemsPerPage = 10;

  // Summary stats
  const summaryStats = useMemo<SummaryStats>(() => {
    if (!buyers || buyers.length === 0) {
      return {
        totalRevenue: 0,
        avgPerBuyer: 0,
        pendingCount: 0,
        confirmedCount: 0
      };
    }

    const totalRevenue = buyers.reduce((sum, buyer) => sum + buyer.total_amount, 0);
    const avgPerBuyer = totalRevenue / buyers.length;
    const pendingCount = buyers.filter(b => b.payment_status === 'pending').length;
    const confirmedCount = buyers.filter(b => b.payment_status === 'confirmed').length;

    return {
      totalRevenue,
      avgPerBuyer,
      pendingCount,
      confirmedCount
    };
  }, [buyers]);

  // Get unique cities
  const cities = useMemo(() => {
    if (!buyers) return [];
    const citySet = new Set(buyers.map(b => b.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [buyers]);

  // Filtered buyers
  const filteredBuyers = useMemo(() => {
    if (!buyers) return [];
    
    return buyers.filter(buyer => {
      const matchesSearch = 
        buyer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.phone?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || buyer.payment_status === statusFilter;
      const matchesCity = cityFilter === 'all' || buyer.city === cityFilter;
      
      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [buyers, searchTerm, statusFilter, cityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredBuyers.length / itemsPerPage);
  const paginatedBuyers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBuyers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBuyers, currentPage]);

  // Handlers
  const handleExportExcel = async () => {
    try {
      await exportBuyersToExcel(filteredBuyers, raffleName, currencyCode);
      toast({
        title: "Excel exportado",
        description: "La lista de compradores se descargó exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportBuyersToPDF(filteredBuyers, raffleName, currencyCode);
      toast({
        title: "PDF exportado",
        description: "La lista de compradores se descargó exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo",
        variant: "destructive",
      });
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Email copiado",
      description: "El email se copió al portapapeles",
    });
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast({
      title: "Teléfono copiado",
      description: "El teléfono se copió al portapapeles",
    });
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hola ${name}, gracias por tu compra en ${raffleName}`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleEmail = (email: string, name: string) => {
    const subject = encodeURIComponent(`Confirmación - ${raffleName}`);
    const body = encodeURIComponent(`Hola ${name},\n\nGracias por tu compra.`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      transfer: 'Transferencia',
      cash: 'Efectivo',
      card: 'Tarjeta',
      paypal: 'PayPal',
      other: 'Otro'
    };
    return labels[method] || method;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive'
    } as const;
    
    const labels = {
      confirmed: 'Confirmado',
      pending: 'Pendiente',
      cancelled: 'Cancelado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando compradores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ✅ Summary Cards - ULTRA COMPACTO para mobile */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-3 w-full min-w-0">
        {/* Card 1: Ingresos */}
        <Card className="min-w-0 w-full">
          <CardContent className="p-2 sm:p-3 min-w-0">
            <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-0 w-full">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-xs font-medium truncate">
                  Ingresos
                </span>
              </div>
              <p className="text-sm sm:text-lg font-bold truncate w-full text-center">
                {formatCurrency(summaryStats.totalRevenue, currencyCode)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Promedio */}
        <Card className="min-w-0 w-full">
          <CardContent className="p-2 sm:p-3 min-w-0">
            <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-0 w-full">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-xs font-medium truncate">
                  Promedio
                </span>
              </div>
              <p className="text-sm sm:text-lg font-bold truncate w-full text-center">
                {formatCurrency(summaryStats.avgPerBuyer, currencyCode)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pendientes */}
        <Card className="min-w-0 w-full">
          <CardContent className="p-2 sm:p-3 min-w-0">
            <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-0 w-full">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-xs font-medium truncate">
                  Pendientes
                </span>
              </div>
              <p className="text-sm sm:text-lg font-bold truncate w-full text-center">
                {summaryStats.pendingCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Confirmados */}
        <Card className="min-w-0 w-full">
          <CardContent className="p-2 sm:p-3 min-w-0">
            <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-0 w-full">
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-xs font-medium truncate">
                  Confirmados
                </span>
              </div>
              <p className="text-sm sm:text-lg font-bold truncate w-full text-center">
                {summaryStats.confirmedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Compradores ({filteredBuyers.length})
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={filteredBuyers.length === 0}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={filteredBuyers.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las ciudades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile: Cards List */}
          <div className="block md:hidden space-y-3">
            {paginatedBuyers.map((buyer) => (
              <Card key={buyer.id} className="overflow-hidden">
                <CardContent className="p-3 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{buyer.full_name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{buyer.city}</p>
                    </div>
                    {getStatusBadge(buyer.payment_status)}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Boletos:</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {buyer.tickets.slice(0, 3).map((ticket, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] px-1">
                            {ticket}
                          </Badge>
                        ))}
                        {buyer.tickets.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] px-1">
                            +{buyer.tickets.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <p className="font-semibold">{formatCurrency(buyer.total_amount, currencyCode)}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  {(buyer.email || buyer.phone) && (
                    <div className="space-y-1 text-xs pt-2 border-t">
                      {buyer.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{buyer.email}</span>
                        </div>
                      )}
                      {buyer.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{buyer.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBuyer(buyer)}
                      className="flex-1 text-xs h-7"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    {buyer.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWhatsApp(buyer.phone!, buyer.full_name)}
                        className="flex-1 text-xs h-7"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                    {buyer.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmail(buyer.email!, buyer.full_name)}
                        className="flex-1 text-xs h-7"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Boletos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBuyers.map((buyer) => (
                  <TableRow key={buyer.id}>
                    <TableCell className="font-medium">{buyer.full_name}</TableCell>
                    <TableCell>{buyer.city}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {buyer.email && (
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{buyer.email}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyEmail(buyer.email!)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {buyer.phone && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3" />
                            <span>{buyer.phone}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPhone(buyer.phone!)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {buyer.tickets.slice(0, 5).map((ticket, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {ticket}
                          </Badge>
                        ))}
                        {buyer.tickets.length > 5 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs cursor-help">
                                  +{buyer.tickets.length - 5}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="grid grid-cols-5 gap-1 max-w-xs">
                                  {buyer.tickets.slice(5).map((ticket, idx) => (
                                    <span key={idx} className="text-xs">{ticket}</span>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(buyer.total_amount, currencyCode)}
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(buyer.payment_method)}</TableCell>
                    <TableCell>
                      {buyer.payment_reference ? (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {buyer.payment_reference}
                        </code>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(buyer.payment_status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBuyer(buyer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {buyer.payment_proof_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(buyer.payment_proof_url!, '_blank')}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                        )}
                        {buyer.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsApp(buyer.phone!, buyer.full_name)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {buyer.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEmail(buyer.email!, buyer.full_name)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Empty State */}
          {filteredBuyers.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || cityFilter !== 'all'
                  ? 'No se encontraron compradores con los filtros aplicados'
                  : 'Aún no hay compradores registrados'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <TicketDetailDialog
        buyer={selectedBuyer}
        isOpen={!!selectedBuyer}
        onClose={() => setSelectedBuyer(null)}
        currencyCode={currencyCode}
      />
    </div>
  );
}
```

---

## 🎯 CAMBIOS IMPLEMENTADOS:

### ✅ **Summary Cards (Líneas 251-322)**
- Grid 2x2 en mobile
- Íconos reducidos: `h-3.5 w-3.5`
- Texto reducido: `text-[10px]`
- Valores reducidos: `text-sm`
- Gap ultra-compacto: `gap-0.5`

### ✅ **Tabla Responsive (Líneas 405-563)**
**MOBILE (<768px):**
- Cards verticales con toda la info
- Contacto, boletos, total, estado visibles
- Botones de acción compactos
- Sin scroll horizontal

**DESKTOP (≥768px):**
- Tabla completa con todas las columnas
- Tooltips para boletos adicionales
- Acciones en línea

---


```