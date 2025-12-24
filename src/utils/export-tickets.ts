import { supabase } from '@/integrations/supabase/client';

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
  canceled: 'Cancelado'
};

export async function exportTicketsToCSV(raffleId: string, raffleName?: string) {
  // 1. Query ALL tickets
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('raffle_id', raffleId)
    .order('ticket_number', { ascending: true });
  
  if (error) throw error;
  
  // 2. Headers
  const headers = [
    'Número de Boleto',
    'Estado',
    'Comprador',
    'Email',
    'Teléfono',
    'Ciudad',
    'Fecha de Compra'
  ];
  
  // 3. Map data
  const rows = tickets.map(ticket => [
    ticket.ticket_number,
    STATUS_LABELS[ticket.status || 'available'] || ticket.status,
    ticket.buyer_name || '-',
    ticket.buyer_email || '-',
    ticket.buyer_phone || '-',
    ticket.buyer_city || '-',
    ticket.sold_at ? new Date(ticket.sold_at).toLocaleDateString('es-MX') : '-'
  ]);
  
  // 4. Generate CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 5. Download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const fileName = raffleName 
    ? `boletos-${raffleName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.csv`
    : `boletos-${raffleId.slice(0, 8)}-${Date.now()}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return { success: true, count: tickets.length };
}
