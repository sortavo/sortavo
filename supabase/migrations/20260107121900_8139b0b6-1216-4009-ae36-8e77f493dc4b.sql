-- Drop functions with different return types first
DROP FUNCTION IF EXISTS get_public_tickets(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS search_public_tickets(UUID, TEXT, INTEGER);

-- Fix get_virtual_tickets: correct argument order for format_virtual_ticket
CREATE OR REPLACE FUNCTION get_virtual_tickets(
  p_raffle_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  ticket_number TEXT,
  ticket_index INTEGER,
  status TEXT,
  buyer_name TEXT,
  buyer_city TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_tickets INTEGER;
  v_numbering_config JSONB;
  v_start_index INTEGER;
  v_end_index INTEGER;
BEGIN
  SELECT r.total_tickets, COALESCE(r.numbering_config, '{}'::jsonb)
  INTO v_total_tickets, v_numbering_config
  FROM raffles r
  WHERE r.id = p_raffle_id 
    AND r.status IN ('active', 'draft', 'paused');

  IF v_total_tickets IS NULL THEN
    RETURN;
  END IF;

  v_start_index := ((p_page - 1) * p_page_size) + 1;
  v_end_index := LEAST(v_start_index + p_page_size - 1, v_total_tickets);

  RETURN QUERY
  WITH virtual_range AS (
    SELECT generate_series(v_start_index, v_end_index) AS idx
  ),
  sold AS (
    SELECT 
      st.id,
      st.ticket_index,
      st.status::TEXT AS st_status,
      st.buyer_name AS st_buyer_name,
      st.buyer_city AS st_buyer_city
    FROM sold_tickets st
    WHERE st.raffle_id = p_raffle_id
      AND st.ticket_index BETWEEN v_start_index AND v_end_index
  )
  SELECT 
    COALESCE(s.id, gen_random_uuid()) AS id,
    format_virtual_ticket(vr.idx, v_numbering_config, v_total_tickets) AS ticket_number,
    vr.idx AS ticket_index,
    COALESCE(s.st_status, 'available') AS status,
    s.st_buyer_name AS buyer_name,
    s.st_buyer_city AS buyer_city
  FROM virtual_range vr
  LEFT JOIN sold s ON s.ticket_index = vr.idx
  ORDER BY vr.idx;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_virtual_tickets TO anon, authenticated;

-- Fix get_public_ticket_counts
CREATE OR REPLACE FUNCTION get_public_ticket_counts(p_raffle_id UUID)
RETURNS TABLE (
  total_count BIGINT,
  sold_count BIGINT,
  reserved_count BIGINT,
  available_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM get_virtual_ticket_counts(p_raffle_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_ticket_counts TO anon, authenticated;

-- Recreate get_public_tickets with matching signature
CREATE FUNCTION get_public_tickets(
  p_raffle_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  ticket_number TEXT,
  ticket_index INTEGER,
  status TEXT,
  buyer_name TEXT,
  buyer_city TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM get_virtual_tickets(p_raffle_id, p_page, p_page_size);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_tickets TO anon, authenticated;

-- Recreate search_public_tickets
CREATE FUNCTION search_public_tickets(
  p_raffle_id UUID,
  p_search TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  ticket_number TEXT,
  ticket_index INTEGER,
  status TEXT,
  buyer_name TEXT,
  buyer_city TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id,
    st.ticket_number,
    st.ticket_index,
    st.status::TEXT,
    st.buyer_name,
    st.buyer_city
  FROM sold_tickets st
  WHERE st.raffle_id = p_raffle_id
    AND st.ticket_number ILIKE '%' || p_search || '%'
  ORDER BY st.ticket_index
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_public_tickets TO anon, authenticated;