-- Drop all versions of get_virtual_tickets to unify
DROP FUNCTION IF EXISTS public.get_virtual_tickets(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_virtual_tickets(uuid, integer, integer, text, text);

-- Create unified version that reads ONLY from numbering_config
CREATE FUNCTION public.get_virtual_tickets(
  p_raffle_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 100
)
RETURNS TABLE (
  ticket_number TEXT,
  ticket_index INTEGER,
  status TEXT,
  buyer_name TEXT,
  reserved_until TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_tickets INTEGER;
  v_offset INTEGER;
  v_numbering_config JSONB;
BEGIN
  -- Get raffle info including numbering_config
  SELECT r.total_tickets, r.numbering_config
  INTO v_total_tickets, v_numbering_config
  FROM raffles r
  WHERE r.id = p_raffle_id;

  IF v_total_tickets IS NULL THEN
    RETURN;
  END IF;

  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY
  WITH virtual_tickets AS (
    SELECT 
      gs.idx AS v_ticket_index,
      format_virtual_ticket(gs.idx, v_numbering_config, v_total_tickets) AS v_ticket_number
    FROM generate_series(0, v_total_tickets - 1) AS gs(idx)
    ORDER BY gs.idx
    LIMIT p_page_size OFFSET v_offset
  )
  SELECT
    vt.v_ticket_number AS ticket_number,
    vt.v_ticket_index AS ticket_index,
    CASE
      WHEN st.id IS NULL THEN 'available'::TEXT
      WHEN st.status = 'reserved' AND st.reserved_until < NOW() THEN 'available'::TEXT
      ELSE st.status::TEXT
    END AS status,
    CASE
      WHEN st.status = 'sold' THEN st.buyer_name
      ELSE NULL
    END AS buyer_name,
    CASE
      WHEN st.status = 'reserved' AND st.reserved_until >= NOW() THEN st.reserved_until
      ELSE NULL
    END AS reserved_until
  FROM virtual_tickets vt
  LEFT JOIN sold_tickets st ON st.raffle_id = p_raffle_id AND st.ticket_index = vt.v_ticket_index
  ORDER BY vt.v_ticket_index;
END;
$$;

COMMENT ON FUNCTION public.get_virtual_tickets(uuid, integer, integer) IS 'Virtual ticket generator - reads numbering config ONLY from numbering_config column (unified version)';