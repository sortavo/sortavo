-- =====================================================
-- FASE 0: Eliminar funciones con conflictos de tipo
-- =====================================================
DROP FUNCTION IF EXISTS get_virtual_ticket_counts(uuid);
DROP FUNCTION IF EXISTS get_public_ticket_counts(uuid);
DROP FUNCTION IF EXISTS get_virtual_tickets(uuid, integer, integer, text, text);
DROP FUNCTION IF EXISTS get_buyers_paginated(uuid, integer, integer, text, text);
DROP FUNCTION IF EXISTS search_public_tickets(uuid, text, integer);
DROP FUNCTION IF EXISTS get_dashboard_charts(uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS release_expired_tickets();
DROP MATERIALIZED VIEW IF EXISTS raffle_stats_mv;

-- =====================================================
-- FASE 1: Crear función auxiliar para expandir ticket_ranges
-- =====================================================
CREATE OR REPLACE FUNCTION expand_order_to_indices(p_ticket_ranges jsonb, p_lucky_indices integer[])
RETURNS TABLE(ticket_index integer) AS $$
BEGIN
  RETURN QUERY
  SELECT generate_series((rng->>'s')::integer, (rng->>'e')::integer)::integer
  FROM jsonb_array_elements(COALESCE(p_ticket_ranges, '[]'::jsonb)) AS rng;
  
  RETURN QUERY
  SELECT unnest(COALESCE(p_lucky_indices, ARRAY[]::integer[]));
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- =====================================================
-- FASE 2: Crear vista de compatibilidad sold_tickets_compat
-- =====================================================
DROP VIEW IF EXISTS sold_tickets_compat;
CREATE OR REPLACE VIEW sold_tickets_compat AS
SELECT
  o.id as order_id,
  o.raffle_id,
  idx.ticket_index,
  format_virtual_ticket(idx.ticket_index, r.numbering_config, r.total_tickets) as ticket_number,
  o.status::ticket_status as status,
  o.buyer_id,
  o.buyer_name,
  o.buyer_email,
  o.buyer_phone,
  o.buyer_city,
  o.payment_proof_url,
  o.payment_method,
  o.reference_code as payment_reference,
  o.order_total,
  o.reserved_at,
  o.reserved_until,
  o.sold_at,
  o.approved_at,
  o.approved_by,
  o.canceled_at,
  o.created_at
FROM orders o
JOIN raffles r ON r.id = o.raffle_id
CROSS JOIN LATERAL expand_order_to_indices(o.ticket_ranges, o.lucky_indices) AS idx(ticket_index)
WHERE o.status IN ('reserved', 'sold');

-- =====================================================
-- FASE 3: Recrear RPCs usando orders
-- =====================================================

-- 3.1 get_virtual_ticket_counts
CREATE FUNCTION get_virtual_ticket_counts(p_raffle_id uuid)
RETURNS TABLE (
  total_count bigint,
  sold_count bigint,
  reserved_count bigint,
  available_count bigint
) AS $$
DECLARE
  v_total_tickets integer;
BEGIN
  SELECT r.total_tickets INTO v_total_tickets
  FROM raffles r WHERE r.id = p_raffle_id;

  IF v_total_tickets IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::bigint;
    RETURN;
  END IF;

  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      COALESCE(SUM(CASE WHEN o.status = 'sold' THEN o.ticket_count ELSE 0 END), 0) as sold,
      COALESCE(SUM(CASE 
        WHEN o.status = 'reserved' AND o.reserved_until > NOW() THEN o.ticket_count 
        ELSE 0 
      END), 0) as reserved
    FROM orders o
    WHERE o.raffle_id = p_raffle_id
  )
  SELECT 
    v_total_tickets::bigint,
    os.sold::bigint,
    os.reserved::bigint,
    (v_total_tickets - os.sold - os.reserved)::bigint
  FROM order_stats os;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3.2 get_public_ticket_counts
CREATE FUNCTION get_public_ticket_counts(p_raffle_id uuid)
RETURNS TABLE (
  total_count bigint,
  sold_count bigint,
  reserved_count bigint,
  available_count bigint
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_virtual_ticket_counts(p_raffle_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3.3 get_virtual_tickets
CREATE FUNCTION get_virtual_tickets(
  p_raffle_id uuid,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_status_filter text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  ticket_index integer,
  ticket_number text,
  status text,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  buyer_city text,
  payment_reference text,
  order_id uuid,
  reserved_at timestamptz,
  sold_at timestamptz
) AS $$
DECLARE
  v_total_tickets integer;
  v_numbering_config jsonb;
  v_offset integer;
BEGIN
  SELECT r.total_tickets, r.numbering_config
  INTO v_total_tickets, v_numbering_config
  FROM raffles r WHERE r.id = p_raffle_id;

  IF v_total_tickets IS NULL THEN RETURN; END IF;
  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY
  WITH occupied AS (
    SELECT 
      idx.ticket_index as tidx,
      o.status as ostatus,
      o.buyer_name as obuyer_name,
      o.buyer_email as obuyer_email,
      o.buyer_phone as obuyer_phone,
      o.buyer_city as obuyer_city,
      o.reference_code as oreference,
      o.id as oorder_id,
      o.reserved_at as oreserved_at,
      o.sold_at as osold_at,
      o.reserved_until as oreserved_until
    FROM orders o
    CROSS JOIN LATERAL expand_order_to_indices(o.ticket_ranges, o.lucky_indices) AS idx(ticket_index)
    WHERE o.raffle_id = p_raffle_id AND o.status IN ('reserved', 'sold')
  ),
  all_tickets AS (
    SELECT 
      gs.idx as ticket_idx,
      format_virtual_ticket(gs.idx, v_numbering_config, v_total_tickets) as ticket_num,
      CASE 
        WHEN occ.ostatus = 'sold' THEN 'sold'
        WHEN occ.ostatus = 'reserved' AND occ.oreserved_until > NOW() THEN 'reserved'
        ELSE 'available'
      END as computed_status,
      occ.obuyer_name, occ.obuyer_email, occ.obuyer_phone, occ.obuyer_city,
      occ.oreference, occ.oorder_id, occ.oreserved_at, occ.osold_at
    FROM generate_series(1, v_total_tickets) AS gs(idx)
    LEFT JOIN occupied occ ON occ.tidx = gs.idx
  )
  SELECT at.ticket_idx, at.ticket_num, at.computed_status,
    at.obuyer_name, at.obuyer_email, at.obuyer_phone, at.obuyer_city,
    at.oreference, at.oorder_id, at.oreserved_at, at.osold_at
  FROM all_tickets at
  WHERE (p_status_filter IS NULL OR at.computed_status = p_status_filter)
    AND (p_search IS NULL OR at.ticket_num ILIKE '%' || p_search || '%' 
         OR at.obuyer_name ILIKE '%' || p_search || '%')
  ORDER BY at.ticket_idx
  LIMIT p_page_size OFFSET v_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3.4 get_buyers_paginated
CREATE FUNCTION get_buyers_paginated(
  p_raffle_id uuid,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 50,
  p_search text DEFAULT NULL,
  p_status_filter text DEFAULT NULL
)
RETURNS TABLE (
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  buyer_city text,
  ticket_count bigint,
  total_amount numeric,
  status text,
  reference_code text,
  order_id uuid,
  reserved_at timestamptz,
  sold_at timestamptz,
  payment_method text,
  payment_proof_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.buyer_name, o.buyer_email, o.buyer_phone, o.buyer_city,
    o.ticket_count::bigint, o.order_total,
    o.status, o.reference_code, o.id,
    o.reserved_at, o.sold_at, o.payment_method, o.payment_proof_url
  FROM orders o
  WHERE o.raffle_id = p_raffle_id
    AND (p_status_filter IS NULL OR o.status = p_status_filter)
    AND (p_search IS NULL 
         OR o.buyer_name ILIKE '%' || p_search || '%'
         OR o.buyer_email ILIKE '%' || p_search || '%'
         OR o.reference_code ILIKE '%' || p_search || '%')
  ORDER BY o.created_at DESC
  LIMIT p_page_size OFFSET (p_page - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3.5 release_expired_tickets
CREATE FUNCTION release_expired_tickets()
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  WITH deleted AS (
    DELETE FROM orders
    WHERE status = 'reserved' AND reserved_until < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3.6 search_public_tickets
CREATE FUNCTION search_public_tickets(
  p_raffle_id uuid,
  p_search text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  ticket_index integer,
  ticket_number text,
  status text,
  buyer_name text,
  buyer_city text
) AS $$
DECLARE
  v_total_tickets integer;
  v_numbering_config jsonb;
BEGIN
  SELECT r.total_tickets, r.numbering_config
  INTO v_total_tickets, v_numbering_config
  FROM raffles r
  WHERE r.id = p_raffle_id AND r.status IN ('active', 'completed');

  IF v_total_tickets IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH occupied AS (
    SELECT idx.ticket_index as tidx, o.status as ostatus,
      o.buyer_name as obuyer_name, o.buyer_city as obuyer_city,
      o.reserved_until as oreserved_until
    FROM orders o
    CROSS JOIN LATERAL expand_order_to_indices(o.ticket_ranges, o.lucky_indices) AS idx(ticket_index)
    WHERE o.raffle_id = p_raffle_id AND o.status IN ('reserved', 'sold')
  ),
  matching AS (
    SELECT gs.idx as ticket_idx,
      format_virtual_ticket(gs.idx, v_numbering_config, v_total_tickets) as ticket_num,
      CASE 
        WHEN occ.ostatus = 'sold' THEN 'sold'
        WHEN occ.ostatus = 'reserved' AND occ.oreserved_until > NOW() THEN 'reserved'
        ELSE 'available'
      END as computed_status,
      occ.obuyer_name, occ.obuyer_city
    FROM generate_series(1, v_total_tickets) AS gs(idx)
    LEFT JOIN occupied occ ON occ.tidx = gs.idx
    WHERE format_virtual_ticket(gs.idx, v_numbering_config, v_total_tickets) ILIKE '%' || p_search || '%'
  )
  SELECT m.ticket_idx, m.ticket_num, m.computed_status,
    CASE WHEN m.computed_status = 'sold' THEN m.obuyer_name ELSE NULL END,
    CASE WHEN m.computed_status = 'sold' THEN m.obuyer_city ELSE NULL END
  FROM matching m
  ORDER BY m.ticket_idx LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3.7 get_dashboard_charts
CREATE FUNCTION get_dashboard_charts(
  p_org_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH daily_sales AS (
    SELECT DATE(o.sold_at AT TIME ZONE 'America/Mexico_City') as sale_date,
      SUM(o.ticket_count) as tickets_sold, SUM(o.order_total) as revenue
    FROM orders o
    JOIN raffles r ON r.id = o.raffle_id
    WHERE r.organization_id = p_org_id AND o.status = 'sold'
      AND o.sold_at >= p_start_date AND o.sold_at <= p_end_date
    GROUP BY DATE(o.sold_at AT TIME ZONE 'America/Mexico_City')
    ORDER BY sale_date
  ),
  payment_methods AS (
    SELECT COALESCE(o.payment_method, 'Sin especificar') as method, SUM(o.ticket_count) as count
    FROM orders o
    JOIN raffles r ON r.id = o.raffle_id
    WHERE r.organization_id = p_org_id AND o.status = 'sold'
      AND o.sold_at >= p_start_date AND o.sold_at <= p_end_date
    GROUP BY o.payment_method ORDER BY count DESC
  ),
  top_raffles AS (
    SELECT r.title, SUM(o.ticket_count) as tickets_sold, SUM(o.order_total) as revenue
    FROM orders o
    JOIN raffles r ON r.id = o.raffle_id
    WHERE r.organization_id = p_org_id AND o.status = 'sold'
      AND o.sold_at >= p_start_date AND o.sold_at <= p_end_date
    GROUP BY r.id, r.title ORDER BY tickets_sold DESC LIMIT 5
  )
  SELECT jsonb_build_object(
    'daily_sales', COALESCE((SELECT jsonb_agg(row_to_json(ds)) FROM daily_sales ds), '[]'::jsonb),
    'payment_methods', COALESCE((SELECT jsonb_agg(row_to_json(pm)) FROM payment_methods pm), '[]'::jsonb),
    'top_raffles', COALESCE((SELECT jsonb_agg(row_to_json(tr)) FROM top_raffles tr), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- =====================================================
-- FASE 4: Recrear vista materializada raffle_stats_mv
-- =====================================================
CREATE MATERIALIZED VIEW raffle_stats_mv AS
SELECT 
  r.id as raffle_id, r.organization_id, r.status, r.total_tickets,
  r.ticket_price, r.title, r.draw_date, r.created_at,
  COALESCE(SUM(CASE WHEN o.status = 'sold' THEN o.ticket_count ELSE 0 END), 0)::integer as sold_count,
  COALESCE(SUM(CASE WHEN o.status = 'reserved' AND o.reserved_until > NOW() THEN o.ticket_count ELSE 0 END), 0)::integer as reserved_count,
  COALESCE(SUM(CASE WHEN o.status = 'sold' THEN o.order_total ELSE 0 END), 0)::numeric as revenue,
  COUNT(DISTINCT CASE WHEN o.status = 'sold' THEN o.buyer_email END)::integer as unique_buyers
FROM raffles r
LEFT JOIN orders o ON o.raffle_id = r.id
WHERE r.archived_at IS NULL
GROUP BY r.id;

CREATE UNIQUE INDEX idx_raffle_stats_mv_raffle_id ON raffle_stats_mv(raffle_id);
CREATE INDEX idx_raffle_stats_mv_org_id ON raffle_stats_mv(organization_id);