import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { raffleId, referenceCode, publicUrl } = await req.json();

    // Validate required fields
    if (!raffleId || !referenceCode || !publicUrl) {
      console.error('Missing required fields:', { raffleId, referenceCode, publicUrl: !!publicUrl });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: raffleId, referenceCode, publicUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Associating payment proof for raffle ${raffleId}, reference ${referenceCode}`);

    // Create Supabase client with service role for reliable updates
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update all reserved tickets with this reference code
    const { data: updatedTickets, error } = await supabase
      .from('tickets')
      .update({ payment_proof_url: publicUrl })
      .eq('raffle_id', raffleId)
      .eq('payment_reference', referenceCode)
      .eq('status', 'reserved')
      .select('id, ticket_number');

    if (error) {
      console.error('Error updating tickets:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update tickets', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updatedCount = updatedTickets?.length || 0;
    console.log(`Updated ${updatedCount} tickets with payment proof`);

    // Get raffle info to notify the organizer
    if (updatedCount > 0) {
      const { data: raffle } = await supabase
        .from('raffles')
        .select('title, organization_id, created_by')
        .eq('id', raffleId)
        .single();

      if (raffle?.created_by && raffle?.organization_id) {
        const ticketNumbers = updatedTickets.map(t => t.ticket_number);
        
        // Get buyer name from one of the tickets
        const { data: ticketInfo } = await supabase
          .from('tickets')
          .select('buyer_name')
          .eq('payment_reference', referenceCode)
          .limit(1)
          .single();

        // Create notification for organizer
        await supabase.from('notifications').insert({
          user_id: raffle.created_by,
          organization_id: raffle.organization_id,
          type: 'payment_pending',
          title: 'Nuevo comprobante de pago',
          message: `${ticketInfo?.buyer_name || 'Un comprador'} ha subido comprobante para los boletos ${ticketNumbers.join(', ')}`,
          link: `/dashboard/raffles/${raffleId}?tab=approvals`,
          metadata: {
            raffle_id: raffleId,
            ticket_numbers: ticketNumbers,
            buyer_name: ticketInfo?.buyer_name,
            reference_code: referenceCode,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedCount,
        ticketNumbers: updatedTickets?.map(t => t.ticket_number) || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
