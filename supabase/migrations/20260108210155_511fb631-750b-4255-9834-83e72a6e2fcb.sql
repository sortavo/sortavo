-- Eliminar función existente con firma diferente
DROP FUNCTION IF EXISTS public.get_order_by_reference(TEXT);

-- Recrear con la nueva firma
CREATE OR REPLACE FUNCTION public.get_order_by_reference(p_reference_code TEXT)
RETURNS TABLE(
  order_id UUID,
  raffle_id UUID,
  raffle_title TEXT,
  raffle_slug TEXT,
  organization_slug TEXT,
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_city TEXT,
  ticket_count INTEGER,
  ticket_numbers TEXT[],
  order_total NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_ticket_numbers TEXT[];
  v_indices INTEGER[];
BEGIN
  -- Obtener orden
  SELECT o.*, r.title as raffle_title, r.slug as raffle_slug, 
         r.numbering_config, r.total_tickets,
         org.slug as org_slug
  INTO v_order
  FROM orders o
  JOIN raffles r ON r.id = o.raffle_id
  JOIN organizations org ON org.id = o.organization_id
  WHERE o.reference_code = p_reference_code;
  
  IF v_order IS NULL THEN
    RETURN;
  END IF;
  
  -- Expandir índices y formatear números
  v_indices := expand_ticket_ranges(v_order.ticket_ranges) || v_order.lucky_indices;
  
  SELECT array_agg(format_virtual_ticket(idx, v_order.numbering_config, v_order.total_tickets) ORDER BY idx)
  INTO v_ticket_numbers
  FROM unnest(v_indices) idx;
  
  RETURN QUERY SELECT 
    v_order.id,
    v_order.raffle_id,
    v_order.raffle_title,
    v_order.raffle_slug,
    v_order.org_slug,
    v_order.buyer_name,
    v_order.buyer_email,
    v_order.buyer_phone,
    v_order.buyer_city,
    v_order.ticket_count,
    COALESCE(v_ticket_numbers, '{}'),
    v_order.order_total,
    v_order.status,
    v_order.created_at,
    v_order.approved_at;
END;
$$;