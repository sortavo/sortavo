-- =====================================================
-- FASE 4-6: FUNCIONES RPC PARA ARQUITECTURA ORDERS
-- =====================================================

-- Función para obtener todos los índices ocupados de una rifa
-- Expande rangos + lucky_indices de órdenes activas
CREATE OR REPLACE FUNCTION public.get_occupied_indices(p_raffle_id UUID)
RETURNS INTEGER[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result INTEGER[] := '{}';
BEGIN
  SELECT array_agg(DISTINCT idx) INTO result
  FROM (
    -- Índices de lucky numbers
    SELECT unnest(lucky_indices) as idx
    FROM orders
    WHERE raffle_id = p_raffle_id 
      AND status IN ('reserved', 'pending', 'sold')
    
    UNION ALL
    
    -- Índices expandidos de rangos
    SELECT x as idx
    FROM orders o,
         jsonb_array_elements(o.ticket_ranges) r,
         generate_series((r.value->>'s')::INT, (r.value->>'e')::INT) x
    WHERE o.raffle_id = p_raffle_id 
      AND o.status IN ('reserved', 'pending', 'sold')
  ) all_indices;
  
  RETURN COALESCE(result, '{}');
END;
$$;

-- Función para verificar si índices específicos están disponibles
CREATE OR REPLACE FUNCTION public.check_indices_available(
  p_raffle_id UUID,
  p_indices INTEGER[]
)
RETURNS TABLE(
  available BOOLEAN,
  conflicting_indices INTEGER[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  occupied INTEGER[];
  conflicts INTEGER[];
BEGIN
  -- Obtener índices ocupados
  SELECT get_occupied_indices(p_raffle_id) INTO occupied;
  
  -- Encontrar conflictos
  SELECT array_agg(idx) INTO conflicts
  FROM unnest(p_indices) idx
  WHERE idx = ANY(occupied);
  
  RETURN QUERY SELECT 
    (conflicts IS NULL OR array_length(conflicts, 1) IS NULL),
    COALESCE(conflicts, '{}');
END;
$$;

-- =====================================================
-- FUNCIÓN PRINCIPAL: reserve_tickets_v2
-- Reemplaza reserve_virtual_tickets_resilient
-- =====================================================
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
SET search_path = public
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
  
  -- Generar referencia única y calcular expiración
  v_reference := 'ORD-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
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

-- =====================================================
-- FUNCIÓN: get_virtual_tickets_v2
-- Usa tabla orders en vez de sold_tickets
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_virtual_tickets_v2(
  p_raffle_id UUID,
  p_page_number INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 100
)
RETURNS TABLE(
  ticket_index INTEGER,
  ticket_number TEXT,
  status TEXT,
  buyer_name TEXT,
  buyer_email TEXT,
  order_reference TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_tickets INTEGER;
  v_numbering_config JSONB;
  v_start_offset INTEGER;
  v_end_offset INTEGER;
  v_start_number INTEGER;
  v_step INTEGER;
BEGIN
  -- Obtener configuración de la rifa
  SELECT total_tickets, COALESCE(numbering_config, '{}'::JSONB)
  INTO v_total_tickets, v_numbering_config
  FROM raffles WHERE id = p_raffle_id;
  
  IF v_total_tickets IS NULL THEN
    RETURN;
  END IF;
  
  -- Calcular rango de índices para esta página
  v_start_offset := (p_page_number - 1) * p_page_size;
  v_end_offset := LEAST(v_start_offset + p_page_size - 1, v_total_tickets - 1);
  
  v_start_number := COALESCE((v_numbering_config->>'start_number')::INTEGER, 1);
  v_step := COALESCE((v_numbering_config->>'step')::INTEGER, 1);
  
  -- Generar boletos virtuales con estado de orders
  RETURN QUERY
  WITH page_indices AS (
    SELECT gs.idx
    FROM generate_series(v_start_offset, v_end_offset) gs(idx)
  ),
  order_data AS (
    SELECT 
      o.id as order_id,
      o.ticket_ranges,
      o.lucky_indices,
      o.status as order_status,
      o.buyer_name as o_buyer_name,
      o.buyer_email as o_buyer_email,
      o.reference_code
    FROM orders o
    WHERE o.raffle_id = p_raffle_id
      AND o.status IN ('reserved', 'pending', 'sold')
  )
  SELECT 
    pi.idx,
    format_virtual_ticket(pi.idx, v_numbering_config, v_total_tickets),
    COALESCE(
      (SELECT od.order_status 
       FROM order_data od 
       WHERE is_index_in_order(od.ticket_ranges, od.lucky_indices, pi.idx)
       LIMIT 1),
      'available'
    ),
    (SELECT od.o_buyer_name 
     FROM order_data od 
     WHERE is_index_in_order(od.ticket_ranges, od.lucky_indices, pi.idx)
     LIMIT 1),
    (SELECT od.o_buyer_email 
     FROM order_data od 
     WHERE is_index_in_order(od.ticket_ranges, od.lucky_indices, pi.idx)
     LIMIT 1),
    (SELECT od.reference_code 
     FROM order_data od 
     WHERE is_index_in_order(od.ticket_ranges, od.lucky_indices, pi.idx)
     LIMIT 1)
  FROM page_indices pi
  ORDER BY pi.idx;
END;
$$;

-- =====================================================
-- FUNCIÓN: get_order_ticket_counts
-- Conteos desde tabla orders
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_order_ticket_counts(p_raffle_id UUID)
RETURNS TABLE(
  total_tickets INTEGER,
  sold_count BIGINT,
  reserved_count BIGINT,
  available_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_sold BIGINT;
  v_reserved BIGINT;
BEGIN
  -- Obtener total de boletos de la rifa
  SELECT r.total_tickets INTO v_total
  FROM raffles r WHERE r.id = p_raffle_id;
  
  IF v_total IS NULL THEN
    RETURN QUERY SELECT 0, 0::BIGINT, 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;
  
  -- Contar desde orders
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'sold' THEN ticket_count ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status IN ('reserved', 'pending') THEN ticket_count ELSE 0 END), 0)
  INTO v_sold, v_reserved
  FROM orders
  WHERE raffle_id = p_raffle_id
    AND status IN ('reserved', 'pending', 'sold');
  
  RETURN QUERY SELECT 
    v_total,
    v_sold,
    v_reserved,
    (v_total - v_sold - v_reserved)::BIGINT;
END;
$$;

-- =====================================================
-- FUNCIÓN: approve_order
-- Aprobar una orden completa
-- =====================================================
CREATE OR REPLACE FUNCTION public.approve_order(
  p_order_id UUID,
  p_approved_by UUID DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  ticket_count INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_count INTEGER;
BEGIN
  UPDATE orders
  SET 
    status = 'sold',
    sold_at = now(),
    approved_at = now(),
    approved_by = COALESCE(p_approved_by, auth.uid()),
    reserved_until = NULL
  WHERE id = p_order_id
    AND status IN ('reserved', 'pending')
  RETURNING orders.ticket_count INTO v_ticket_count;
  
  IF v_ticket_count IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'Orden no encontrada o ya procesada';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, v_ticket_count, NULL::TEXT;
END;
$$;

-- =====================================================
-- FUNCIÓN: reject_order
-- Rechazar/cancelar una orden
-- =====================================================
CREATE OR REPLACE FUNCTION public.reject_order(p_order_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  ticket_count INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_count INTEGER;
BEGIN
  UPDATE orders
  SET 
    status = 'canceled',
    canceled_at = now(),
    reserved_until = NULL
  WHERE id = p_order_id
    AND status IN ('reserved', 'pending')
  RETURNING orders.ticket_count INTO v_ticket_count;
  
  IF v_ticket_count IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'Orden no encontrada o ya procesada';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, v_ticket_count, NULL::TEXT;
END;
$$;

-- =====================================================
-- FUNCIÓN: cleanup_expired_orders
-- Limpiar reservas expiradas (para cron job)
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE orders
  SET 
    status = 'canceled',
    canceled_at = now()
  WHERE status = 'reserved'
    AND reserved_until < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;