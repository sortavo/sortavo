CREATE OR REPLACE FUNCTION public.reserve_tickets_v2(
  p_raffle_id UUID,
  p_ticket_indices INTEGER[],
  p_buyer_name TEXT,
  p_buyer_email TEXT,
  p_buyer_phone TEXT DEFAULT NULL,
  p_buyer_city TEXT DEFAULT NULL,
  p_reservation_minutes INTEGER DEFAULT 15,
  p_order_total NUMERIC DEFAULT NULL,
  p_is_lucky_numbers BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  success BOOLEAN,
  order_id UUID,
  reference_code TEXT,
  reserved_until TIMESTAMPTZ,
  ticket_count INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_order_id UUID;
  v_reference TEXT;
  v_reserved_until TIMESTAMPTZ;
  v_org_id UUID;
  v_ranges JSONB;
  v_conflicts INTEGER[];
  v_is_available BOOLEAN;
BEGIN
  -- Obtener organization_id de la rifa
  SELECT organization_id INTO v_org_id 
  FROM raffles WHERE id = p_raffle_id;
  
  IF v_org_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TIMESTAMPTZ, 0, 
      'Rifa no encontrada';
    RETURN;
  END IF;
  
  -- Verificar disponibilidad
  SELECT ca.available, ca.conflicting_indices 
  INTO v_is_available, v_conflicts
  FROM check_indices_available(p_raffle_id, p_ticket_indices) ca;
  
  IF NOT v_is_available THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TIMESTAMPTZ, 0, 
      'Algunos boletos ya no están disponibles: ' || array_length(v_conflicts, 1)::TEXT || ' en conflicto';
    RETURN;
  END IF;
  
  -- Generar referencia única usando función original (sin prefijo ORD-)
  v_reference := public.generate_reference_code();
  v_reserved_until := now() + (p_reservation_minutes || ' minutes')::INTERVAL;
  v_order_id := gen_random_uuid();
  
  -- Comprimir rangos si no son lucky numbers
  IF p_is_lucky_numbers THEN
    v_ranges := '[]'::JSONB;
  ELSE
    v_ranges := compress_ticket_indices(p_ticket_indices);
  END IF;
  
  -- Insertar orden
  INSERT INTO orders (
    id, raffle_id, organization_id,
    buyer_name, buyer_email, buyer_phone, buyer_city,
    ticket_ranges, lucky_indices, ticket_count,
    reference_code, order_total,
    status, reserved_at, reserved_until
  ) VALUES (
    v_order_id, p_raffle_id, v_org_id,
    p_buyer_name, p_buyer_email, p_buyer_phone, p_buyer_city,
    v_ranges,
    CASE WHEN p_is_lucky_numbers THEN p_ticket_indices ELSE '{}'::INTEGER[] END,
    array_length(p_ticket_indices, 1),
    v_reference, p_order_total,
    'reserved', now(), v_reserved_until
  );
  
  RETURN QUERY SELECT TRUE, v_order_id, v_reference, v_reserved_until, 
    array_length(p_ticket_indices, 1), NULL::TEXT;
END;
$$;