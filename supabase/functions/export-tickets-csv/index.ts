import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
  canceled: 'Cancelado'
};

interface TicketRange {
  s: number;
  e: number;
}

interface Order {
  ticket_ranges: TicketRange[];
  status: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_city: string | null;
  approved_at: string | null;
}

interface NumberingConfig {
  pad_width?: number;
  pad_char?: string;
  prefix?: string;
  suffix?: string;
  start_number?: number;
}

function formatTicketNumber(index: number, config: NumberingConfig | null): string {
  const startNumber = config?.start_number ?? 1;
  const ticketNum = startNumber + index;
  const padWidth = config?.pad_width ?? 4;
  const padChar = config?.pad_char ?? '0';
  const prefix = config?.prefix ?? '';
  const suffix = config?.suffix ?? '';
  
  const paddedNum = String(ticketNum).padStart(padWidth, padChar);
  return `${prefix}${paddedNum}${suffix}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { raffle_id, status_filter } = await req.json();

    if (!raffle_id) {
      return new Response(
        JSON.stringify({ error: 'raffle_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raffle info for filename and config
    const { data: raffle } = await supabase
      .from('raffles')
      .select('title, total_tickets, numbering_config')
      .eq('id', raffle_id)
      .single();

    const numberingConfig = raffle?.numbering_config as NumberingConfig | null;

    // Fetch orders and expand ticket_ranges into individual tickets
    let query = supabase
      .from('orders')
      .select('ticket_ranges, status, buyer_name, buyer_email, buyer_phone, buyer_city, approved_at')
      .eq('raffle_id', raffle_id);

    if (status_filter) {
      if (Array.isArray(status_filter)) {
        query = query.in('status', status_filter);
      } else {
        query = query.eq('status', status_filter);
      }
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }

    // Expand orders into individual tickets
    const tickets: Array<{
      ticket_index: number;
      ticket_number: string;
      status: string;
      buyer_name: string | null;
      buyer_email: string | null;
      buyer_phone: string | null;
      buyer_city: string | null;
      approved_at: string | null;
    }> = [];

    for (const order of (orders as Order[]) || []) {
      const ranges = order.ticket_ranges || [];
      for (const range of ranges) {
        for (let idx = range.s; idx <= range.e; idx++) {
          tickets.push({
            ticket_index: idx,
            ticket_number: formatTicketNumber(idx, numberingConfig),
            status: order.status,
            buyer_name: order.buyer_name,
            buyer_email: order.buyer_email,
            buyer_phone: order.buyer_phone,
            buyer_city: order.buyer_city,
            approved_at: order.approved_at,
          });
        }
      }
    }

    // Sort by ticket index
    tickets.sort((a, b) => a.ticket_index - b.ticket_index);

    console.log(`Exporting ${tickets.length} tickets for raffle ${raffle_id}`);

    // CSV headers
    const headers = [
      'Número de Boleto',
      'Estado',
      'Comprador',
      'Email',
      'Teléfono',
      'Ciudad',
      'Fecha de Aprobación'
    ];

    // Build CSV content
    const csvRows: string[] = [headers.join(',')];

    for (const ticket of tickets) {
      const row = [
        ticket.ticket_number,
        STATUS_LABELS[ticket.status || 'available'] || ticket.status,
        ticket.buyer_name || '-',
        ticket.buyer_email || '-',
        ticket.buyer_phone || '-',
        ticket.buyer_city || '-',
        ticket.approved_at ? new Date(ticket.approved_at).toLocaleDateString('es-MX') : '-'
      ];
      csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    }

    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.join('\n');

    // Generate filename
    const raffleName = raffle?.title || raffle_id.slice(0, 8);
    const safeRaffleName = raffleName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '-').slice(0, 50);
    const filename = `boletos-${safeRaffleName}-${Date.now()}.csv`;

    console.log(`Export complete: ${tickets.length} tickets exported`);

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Total-Count': String(tickets.length),
        'X-Filename': filename
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Export error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
