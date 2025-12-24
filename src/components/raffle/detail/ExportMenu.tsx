import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Ticket,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { exportBuyersToCSV } from '@/utils/export-buyers';
import { exportTicketsToCSV } from '@/utils/export-tickets';
import { exportTransactionsToExcel } from '@/utils/export-transactions';
import { exportFinancialReportPDF } from '@/utils/export-financial-pdf';

interface ExportMenuProps {
  raffleId: string;
  raffleName: string;
}

type ExportType = 'buyers' | 'tickets' | 'transactions' | 'financial';

export function ExportMenu({ raffleId, raffleName }: ExportMenuProps) {
  const [loading, setLoading] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType) => {
    setLoading(type);
    
    try {
      switch (type) {
        case 'buyers':
          const buyersResult = await exportBuyersToCSV(raffleId, raffleName);
          toast.success(`Exportados ${buyersResult.count} compradores`);
          break;
        
        case 'tickets':
          const ticketsResult = await exportTicketsToCSV(raffleId, raffleName);
          toast.success(`Exportados ${ticketsResult.count} boletos`);
          break;
        
        case 'transactions':
          const transResult = await exportTransactionsToExcel(raffleId, raffleName);
          toast.success(`Exportadas ${transResult.count} transacciones`);
          break;
        
        case 'financial':
          await exportFinancialReportPDF(raffleId, raffleName);
          toast.success('Reporte financiero generado');
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar datos');
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={() => handleExport('buyers')}
          disabled={loading !== null}
        >
          <Users className="h-4 w-4 mr-2" />
          Exportar Compradores (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('tickets')}
          disabled={loading !== null}
        >
          <Ticket className="h-4 w-4 mr-2" />
          Exportar Boletos (CSV)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleExport('transactions')}
          disabled={loading !== null}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Transacciones (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('financial')}
          disabled={loading !== null}
        >
          <FileText className="h-4 w-4 mr-2" />
          Reporte Financiero (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
