import { supabase } from '@/integrations/supabase/client';

export async function exportBuyersToCSV(raffleId: string, raffleName?: string) {
  // 1. Query all sold tickets with buyer info
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('raffle_id', raffleId)
    .eq('status', 'sold')
    .order('sold_at', { ascending: true });
  
  if (error) throw error;
  
  // 2. Create CSV headers
  const headers = [
    'Boleto',
    'Nombre',
    'Email',
    'Teléfono',
    'Ciudad',
    'Método de Pago',
    'Referencia de Pago',
    'Fecha de Compra'
  ];
  
  // 3. Convert data to CSV rows
  const rows = tickets.map(ticket => [
    ticket.ticket_number,
    ticket.buyer_name || '',
    ticket.buyer_email || '',
    ticket.buyer_phone || '',
    ticket.buyer_city || '',
    ticket.payment_method || '',
    ticket.payment_reference || '',
    ticket.sold_at ? new Date(ticket.sold_at).toLocaleString('es-MX') : ''
  ]);
  
  // 4. Generate CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // 5. Add BOM for proper Excel encoding
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 6. Trigger download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const fileName = raffleName 
    ? `compradores-${raffleName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.csv`
    : `compradores-${raffleId.slice(0, 8)}-${Date.now()}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return { success: true, count: tickets.length };
}
