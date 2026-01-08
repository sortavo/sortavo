-- Add resilient reservation function for large (10k+) selections.
-- It reserves requested indices, and if some collide (sold/reserved), it fills the missing amount with other available random tickets.

CREATE OR REPLACE FUNCTION public.reserve_virtual_tickets_resilient(
  p_raffle_id uuid,
  p_ticket_indices integer[],
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_buyer_city text DEFAULT NULL,
  p_reservation_minutes integer DEFAULT 15,
  p_order_total numeric DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  reference_code text,
  reserved_until timestamptz,
  reserved_count integer,
  ticket_indices integer[],
  ticket_numbers text[],
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference_code text;
  v_reserved_until timestamptz;
  v_numbering_config jsonb;
  v_total_tickets integer;

  v_requested_indices integer[];
  v_requested_count integer;

  v_final_indices integer[];
  v_final_numbers text[];

  v_inserted_count integer := 0;
  v_missing integer := 0;

  v_attempt integer := 0;
  v_candidate_n integer;

  v_more_indices integer[];
  v_more_numbers text[];
  v_inserted_more integer := 0;
BEGIN
  -- Basic validation
  IF p_ticket_indices IS NULL OR array_length(p_ticket_indices, 1) IS NULL OR array_length(p_ticket_indices, 1) = 0 THEN
    RETURN QUERY SELECT false, NULL::text, NULL::timestamptz, 0, NULL::integer[], NULL::text[], 'No se recibieron boletos'::text;
    RETURN;
  END IF;

  IF array_length(p_ticket_indices, 1) > 10000 THEN
    RETURN QUERY SELECT false, NULL::text, NULL::timestamptz, 0, NULL::integer[], NULL::text[], 'Máximo 10,000 boletos por reservación'::text;
    RETURN;
  END IF;

  -- Get numbering config and total tickets
  SELECT r.numbering_config, r.total_tickets
  INTO v_numbering_config, v_total_tickets
  FROM public.raffles r
  WHERE r.id = p_raffle_id;

  IF v_total_tickets IS NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::timestamptz, 0, NULL::integer[], NULL::text[], 'Rifa no encontrada'::text;
    RETURN;
  END IF;

  -- De-duplicate and clamp indices to valid range
  SELECT array_agg(DISTINCT idx ORDER BY idx)
  INTO v_requested_indices
  FROM unnest(p_ticket_indices) AS idx
  WHERE idx >= 0 AND idx < v_total_tickets;

  v_requested_count := COALESCE(array_length(v_requested_indices, 1), 0);

  IF v_requested_count = 0 THEN
    RETURN QUERY SELECT false, NULL::text, NULL::timestamptz, 0, NULL::integer[], NULL::text[], 'No se encontraron boletos válidos'::text;
    RETURN;
  END IF;

  -- Generate reference and reservation window
  v_reference_code := public.generate_reference_code();
  v_reserved_until := NOW() + (p_reservation_minutes || ' minutes')::interval;

  -- Cleanup expired reservations for requested indices
  DELETE FROM public.sold_tickets st
  WHERE st.raffle_id = p_raffle_id
    AND st.ticket_index = ANY(v_requested_indices)
    AND st.status = 'reserved'
    AND st.reserved_until < NOW();

  -- Insert requested indices (best effort)
  WITH inserted AS (
    INSERT INTO public.sold_tickets (
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
      idx,
      public.format_virtual_ticket(idx, v_numbering_config, v_total_tickets),
      'reserved'::public.ticket_status,
      p_buyer_name,
      p_buyer_email,
      p_buyer_phone,
      p_buyer_city,
      NOW(),
      v_reserved_until,
      v_reference_code,
      p_order_total
    FROM unnest(v_requested_indices) AS idx
    ON CONFLICT (raffle_id, ticket_index) DO NOTHING
    RETURNING ticket_index, ticket_number
  )
  SELECT
    COALESCE(count(*), 0)::int,
    COALESCE(array_agg(ticket_index ORDER BY ticket_index), ARRAY[]::int[]),
    COALESCE(array_agg(ticket_number ORDER BY ticket_index), ARRAY[]::text[])
  INTO v_inserted_count, v_final_indices, v_final_numbers
  FROM inserted;

  v_missing := v_requested_count - v_inserted_count;

  -- If we missed some due to collisions, fill with other available random indices
  WHILE v_missing > 0 AND v_attempt < 12 LOOP
    v_attempt := v_attempt + 1;

    -- Generate more candidates than needed to counter collisions/duplicates
    v_candidate_n := LEAST(v_missing * 12, 200000);

    WITH candidates AS (
      SELECT DISTINCT floor(random() * v_total_tickets)::int AS idx
      FROM generate_series(1, v_candidate_n)
    ), available AS (
      SELECT c.idx
      FROM candidates c
      LEFT JOIN public.sold_tickets st
        ON st.raffle_id = p_raffle_id
       AND st.ticket_index = c.idx
       AND (
         st.status = 'sold'
         OR (st.status = 'reserved' AND st.reserved_until > NOW())
       )
      WHERE st.id IS NULL
        AND c.idx >= 0 AND c.idx < v_total_tickets
        AND (c.idx <> ALL(v_final_indices))
      LIMIT v_missing
    ), inserted_more AS (
      INSERT INTO public.sold_tickets (
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
        a.idx,
        public.format_virtual_ticket(a.idx, v_numbering_config, v_total_tickets),
        'reserved'::public.ticket_status,
        p_buyer_name,
        p_buyer_email,
        p_buyer_phone,
        p_buyer_city,
        NOW(),
        v_reserved_until,
        v_reference_code,
        p_order_total
      FROM available a
      ON CONFLICT (raffle_id, ticket_index) DO NOTHING
      RETURNING ticket_index, ticket_number
    )
    SELECT
      COALESCE(count(*), 0)::int,
      COALESCE(array_agg(ticket_index ORDER BY ticket_index), ARRAY[]::int[]),
      COALESCE(array_agg(ticket_number ORDER BY ticket_index), ARRAY[]::text[])
    INTO v_inserted_more, v_more_indices, v_more_numbers
    FROM inserted_more;

    IF v_inserted_more = 0 THEN
      EXIT;
    END IF;

    v_final_indices := v_final_indices || v_more_indices;
    v_final_numbers := v_final_numbers || v_more_numbers;

    v_missing := v_requested_count - COALESCE(array_length(v_final_indices, 1), 0);
  END LOOP;

  IF v_missing = 0 THEN
    RETURN QUERY SELECT
      true,
      v_reference_code,
      v_reserved_until,
      COALESCE(array_length(v_final_indices, 1), 0),
      v_final_indices,
      v_final_numbers,
      NULL::text;
  ELSE
    -- Rollback everything for this reference
    DELETE FROM public.sold_tickets st
    WHERE st.payment_reference = v_reference_code;

    RETURN QUERY SELECT
      false,
      NULL::text,
      NULL::timestamptz,
      0,
      NULL::integer[],
      NULL::text[],
      'No se pudieron reservar 10,000 boletos. Intenta de nuevo.'::text;
  END IF;
END;
$$;