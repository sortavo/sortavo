-- First drop the old function that references tickets table
DROP FUNCTION IF EXISTS public.get_buyers_paginated(uuid,text,text,text,timestamp with time zone,timestamp with time zone,integer,integer);

-- Recreate get_buyers_paginated to use sold_tickets instead of tickets
CREATE FUNCTION public.get_buyers_paginated(
  p_raffle_id UUID,
  p_status TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  buyer_key TEXT,
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_city TEXT,
  ticket_count BIGINT,
  ticket_numbers TEXT[],
  status TEXT,
  payment_reference TEXT,
  payment_method TEXT,
  order_total NUMERIC,
  first_reserved_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  has_payment_proof BOOLEAN,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count BIGINT;
  v_offset INTEGER;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  -- Get total count of unique buyers matching filters
  SELECT COUNT(DISTINCT COALESCE(t.buyer_email, t.buyer_phone, t.buyer_name))
  INTO v_total_count
  FROM public.sold_tickets t
  WHERE t.raffle_id = p_raffle_id
    AND t.buyer_name IS NOT NULL
    AND (p_status IS NULL OR p_status = 'all' OR t.status = p_status::ticket_status)
    AND (p_city IS NULL OR t.buyer_city = p_city)
    AND (p_search IS NULL OR 
         t.buyer_name ILIKE '%' || p_search || '%' OR
         t.buyer_email ILIKE '%' || p_search || '%' OR
         t.buyer_phone ILIKE '%' || p_search || '%')
    AND (p_start_date IS NULL OR t.reserved_at >= p_start_date)
    AND (p_end_date IS NULL OR t.reserved_at <= p_end_date);

  RETURN QUERY
  WITH buyer_groups AS (
    SELECT 
      COALESCE(t.buyer_email, t.buyer_phone, t.buyer_name) as buyer_key,
      MAX(t.buyer_name) as buyer_name,
      MAX(t.buyer_email) as buyer_email,
      MAX(t.buyer_phone) as buyer_phone,
      MAX(t.buyer_city) as buyer_city,
      COUNT(*) as ticket_count,
      ARRAY_AGG(t.ticket_number ORDER BY t.ticket_number) as ticket_numbers,
      MAX(t.status::TEXT) as status,
      MAX(t.payment_reference) as payment_reference,
      MAX(t.payment_method) as payment_method,
      MAX(t.order_total) as order_total,
      MIN(t.reserved_at) as first_reserved_at,
      MAX(t.sold_at) as sold_at,
      BOOL_OR(t.payment_proof_url IS NOT NULL) as has_payment_proof
    FROM public.sold_tickets t
    WHERE t.raffle_id = p_raffle_id
      AND t.buyer_name IS NOT NULL
      AND (p_status IS NULL OR p_status = 'all' OR t.status = p_status::ticket_status)
      AND (p_city IS NULL OR t.buyer_city = p_city)
      AND (p_search IS NULL OR 
           t.buyer_name ILIKE '%' || p_search || '%' OR
           t.buyer_email ILIKE '%' || p_search || '%' OR
           t.buyer_phone ILIKE '%' || p_search || '%')
      AND (p_start_date IS NULL OR t.reserved_at >= p_start_date)
      AND (p_end_date IS NULL OR t.reserved_at <= p_end_date)
    GROUP BY COALESCE(t.buyer_email, t.buyer_phone, t.buyer_name)
    ORDER BY MAX(t.reserved_at) DESC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT 
    bg.buyer_key,
    bg.buyer_name,
    bg.buyer_email,
    bg.buyer_phone,
    bg.buyer_city,
    bg.ticket_count,
    bg.ticket_numbers,
    bg.status,
    bg.payment_reference,
    bg.payment_method,
    bg.order_total,
    bg.first_reserved_at,
    bg.sold_at,
    bg.has_payment_proof,
    v_total_count as total_count
  FROM buyer_groups bg;
END;
$$;