-- =====================================================
-- EXHAUSTIVE AUDIT: Virtual Tickets Cleanup & Instant Expiry Fix
-- =====================================================

-- STEP 0: Drop functions that need signature changes
DROP FUNCTION IF EXISTS public.get_virtual_ticket_counts(UUID);
DROP FUNCTION IF EXISTS public.get_public_ticket_counts(UUID);

-- STEP 1: Fix get_virtual_tickets to treat expired reservations as available
CREATE OR REPLACE FUNCTION public.get_virtual_tickets(
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
  v_number_start INTEGER;
  v_number_format TEXT;
  v_offset INTEGER;
BEGIN
  -- Get raffle configuration
  SELECT 
    r.total_tickets,
    COALESCE((r.customization->>'number_start')::INTEGER, 1),
    COALESCE(r.customization->>'number_format', 'numeric')
  INTO v_total_tickets, v_number_start, v_number_format
  FROM raffles r
  WHERE r.id = p_raffle_id;
  
  IF v_total_tickets IS NULL THEN
    RETURN;
  END IF;
  
  v_offset := (p_page - 1) * p_page_size;
  
  -- Return virtual tickets with sold_tickets overlay
  -- CRITICAL: Expired reservations (reserved_until < NOW()) are treated as 'available'
  RETURN QUERY
  SELECT 
    st.id,
    CASE 
      WHEN v_number_format = 'padded' THEN LPAD((v_number_start + gs.idx)::TEXT, 4, '0')
      ELSE (v_number_start + gs.idx)::TEXT
    END AS ticket_number,
    gs.idx AS ticket_index,
    CASE 
      WHEN st.id IS NULL THEN 'available'::TEXT
      WHEN st.status = 'reserved' AND st.reserved_until < NOW() THEN 'available'::TEXT
      ELSE st.status::TEXT
    END AS status,
    CASE 
      WHEN st.id IS NULL THEN NULL
      WHEN st.status = 'reserved' AND st.reserved_until < NOW() THEN NULL
      ELSE st.buyer_name
    END AS buyer_name,
    CASE 
      WHEN st.id IS NULL THEN NULL
      WHEN st.status = 'reserved' AND st.reserved_until < NOW() THEN NULL
      ELSE st.buyer_city
    END AS buyer_city
  FROM generate_series(0, v_total_tickets - 1) AS gs(idx)
  LEFT JOIN sold_tickets st ON st.raffle_id = p_raffle_id AND st.ticket_index = gs.idx
  ORDER BY gs.idx
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

-- STEP 2: Fix get_virtual_ticket_counts to exclude expired reservations from reserved count
CREATE FUNCTION public.get_virtual_ticket_counts(
  p_raffle_id UUID
)
RETURNS TABLE (
  total_count INTEGER,
  sold_count INTEGER,
  reserved_count INTEGER,
  available_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_sold INTEGER;
  v_reserved INTEGER;
BEGIN
  -- Get total from raffle config
  SELECT r.total_tickets INTO v_total
  FROM raffles r
  WHERE r.id = p_raffle_id;
  
  IF v_total IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Count sold tickets
  SELECT COUNT(*) INTO v_sold
  FROM sold_tickets st
  WHERE st.raffle_id = p_raffle_id AND st.status = 'sold';
  
  -- Count ACTIVE reservations (NOT expired)
  SELECT COUNT(*) INTO v_reserved
  FROM sold_tickets st
  WHERE st.raffle_id = p_raffle_id 
    AND st.status = 'reserved'
    AND st.reserved_until >= NOW();
  
  RETURN QUERY SELECT 
    v_total,
    v_sold,
    v_reserved,
    v_total - v_sold - v_reserved;
END;
$$;

-- STEP 3: Fix get_public_ticket_counts (same logic for public page)
CREATE FUNCTION public.get_public_ticket_counts(
  p_raffle_id UUID
)
RETURNS TABLE (
  total_count INTEGER,
  sold_count INTEGER,
  reserved_count INTEGER,
  available_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_sold INTEGER;
  v_reserved INTEGER;
BEGIN
  SELECT r.total_tickets INTO v_total
  FROM raffles r
  WHERE r.id = p_raffle_id;
  
  IF v_total IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0, 0;
    RETURN;
  END IF;
  
  SELECT COUNT(*) INTO v_sold
  FROM sold_tickets st
  WHERE st.raffle_id = p_raffle_id AND st.status = 'sold';
  
  -- Only count NON-expired reservations
  SELECT COUNT(*) INTO v_reserved
  FROM sold_tickets st
  WHERE st.raffle_id = p_raffle_id 
    AND st.status = 'reserved'
    AND st.reserved_until >= NOW();
  
  RETURN QUERY SELECT 
    v_total,
    v_sold,
    v_reserved,
    v_total - v_sold - v_reserved;
END;
$$;

-- STEP 4: Fix reserve_virtual_tickets to pre-clean expired reservations
CREATE OR REPLACE FUNCTION public.reserve_virtual_tickets(
  p_raffle_id UUID,
  p_ticket_indices INTEGER[],
  p_buyer_name TEXT,
  p_buyer_email TEXT,
  p_buyer_phone TEXT,
  p_buyer_city TEXT DEFAULT NULL,
  p_reservation_minutes INTEGER DEFAULT 15,
  p_order_total NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  reference_code TEXT,
  reserved_until TIMESTAMPTZ,
  reserved_count INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_code TEXT;
  v_reserved_until TIMESTAMPTZ;
  v_inserted INTEGER := 0;
  v_total_requested INTEGER;
  v_number_start INTEGER;
  v_number_format TEXT;
BEGIN
  v_total_requested := array_length(p_ticket_indices, 1);
  IF v_total_requested IS NULL OR v_total_requested = 0 THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TIMESTAMPTZ, 0, 'No se especificaron boletos'::TEXT;
    RETURN;
  END IF;
  
  -- Get raffle config
  SELECT 
    COALESCE((r.customization->>'number_start')::INTEGER, 1),
    COALESCE(r.customization->>'number_format', 'numeric')
  INTO v_number_start, v_number_format
  FROM raffles r
  WHERE r.id = p_raffle_id;
  
  -- Generate reference code
  v_ref_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  v_reserved_until := NOW() + (p_reservation_minutes || ' minutes')::INTERVAL;
  
  -- PRE-CLEANUP: Delete expired reservations for the requested indices ONLY
  -- This ensures we can reserve tickets that just expired without waiting for cron
  DELETE FROM sold_tickets
  WHERE raffle_id = p_raffle_id
    AND ticket_index = ANY(p_ticket_indices)
    AND status = 'reserved'
    AND reserved_until < NOW();
  
  -- Insert new reservations (ON CONFLICT DO NOTHING handles race conditions)
  WITH to_insert AS (
    SELECT 
      unnest(p_ticket_indices) AS idx
  ),
  inserted AS (
    INSERT INTO sold_tickets (
      raffle_id,
      ticket_index,
      ticket_number,
      status,
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_city,
      reserved_at,
      reserved_until,
      payment_reference,
      order_total
    )
    SELECT 
      p_raffle_id,
      ti.idx,
      CASE 
        WHEN v_number_format = 'padded' THEN LPAD((v_number_start + ti.idx)::TEXT, 4, '0')
        ELSE (v_number_start + ti.idx)::TEXT
      END,
      'reserved',
      p_buyer_name,
      p_buyer_email,
      p_buyer_phone,
      p_buyer_city,
      NOW(),
      v_reserved_until,
      v_ref_code,
      p_order_total
    FROM to_insert ti
    ON CONFLICT (raffle_id, ticket_index) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM inserted;
  
  -- Check if all were reserved
  IF v_inserted < v_total_requested THEN
    -- Rollback: delete any we did insert
    DELETE FROM sold_tickets
    WHERE raffle_id = p_raffle_id
      AND payment_reference = v_ref_code;
    
    RETURN QUERY SELECT 
      FALSE, 
      NULL::TEXT, 
      NULL::TIMESTAMPTZ, 
      0, 
      format('%s boleto(s) ya no estaban disponibles', v_total_requested - v_inserted)::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    TRUE, 
    v_ref_code, 
    v_reserved_until, 
    v_inserted, 
    NULL::TEXT;
END;
$$;

-- STEP 5: Update release-expired-tickets cron to run every 1 minute
SELECT cron.unschedule('release-expired-tickets');
SELECT cron.schedule(
  'release-expired-tickets',
  '* * * * *',
  'SELECT public.release_expired_tickets()'
);

-- STEP 6: Delete legacy cron jobs
SELECT cron.unschedule('job-manager-orchestrator');
SELECT cron.unschedule('process-ticket-batch');

-- STEP 7: Drop legacy functions if they exist
DROP FUNCTION IF EXISTS public.generate_ticket_batch(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.generate_ticket_batch_v2(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.generate_ticket_batch_v3(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.process_ticket_batch();
DROP FUNCTION IF EXISTS public.start_ticket_generation(UUID);
DROP FUNCTION IF EXISTS public.get_raffle_ticket_status(UUID);

-- STEP 8: Drop legacy tables if they exist
DROP TABLE IF EXISTS public.ticket_generation_jobs CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;

-- STEP 9: Ensure proper index for reservation cleanup performance
CREATE INDEX IF NOT EXISTS idx_sold_tickets_reservation_cleanup 
ON sold_tickets (raffle_id, status, reserved_until) 
WHERE status = 'reserved';