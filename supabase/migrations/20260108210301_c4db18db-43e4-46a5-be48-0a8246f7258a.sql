-- Corregir función de migración (usar MIN para UUID en vez de MAX)
CREATE OR REPLACE FUNCTION public.migrate_sold_tickets_to_orders()
RETURNS TABLE(
  orders_created INTEGER,
  tickets_migrated INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orders_created INTEGER := 0;
  v_tickets_migrated INTEGER := 0;
  v_order_record RECORD;
  v_ranges JSONB;
BEGIN
  -- Agrupar sold_tickets por payment_reference y raffle_id
  FOR v_order_record IN 
    SELECT 
      st.raffle_id,
      r.organization_id,
      st.payment_reference,
      MAX(st.buyer_name) as buyer_name,
      MAX(st.buyer_email) as buyer_email,
      MAX(st.buyer_phone) as buyer_phone,
      MAX(st.buyer_city) as buyer_city,
      (array_agg(st.buyer_id) FILTER (WHERE st.buyer_id IS NOT NULL))[1] as buyer_id,
      MAX(st.payment_method) as payment_method,
      MAX(st.payment_proof_url) as payment_proof_url,
      MAX(st.order_total) as order_total,
      MAX(st.status::TEXT) as status,
      MIN(st.reserved_at) as reserved_at,
      MAX(st.reserved_until) as reserved_until,
      MAX(st.sold_at) as sold_at,
      MAX(st.approved_at) as approved_at,
      (array_agg(st.approved_by) FILTER (WHERE st.approved_by IS NOT NULL))[1] as approved_by,
      MAX(st.canceled_at) as canceled_at,
      MIN(st.created_at) as created_at,
      array_agg(st.ticket_index ORDER BY st.ticket_index) as ticket_indices,
      COUNT(*)::INTEGER as ticket_count
    FROM sold_tickets st
    JOIN raffles r ON r.id = st.raffle_id
    WHERE st.payment_reference IS NOT NULL
      AND st.status IN ('reserved', 'sold')
    GROUP BY st.raffle_id, r.organization_id, st.payment_reference
  LOOP
    -- Comprimir índices en rangos
    v_ranges := compress_ticket_indices(v_order_record.ticket_indices);
    
    -- Insertar en orders
    INSERT INTO orders (
      raffle_id, organization_id,
      buyer_id, buyer_name, buyer_email, buyer_phone, buyer_city,
      ticket_ranges, lucky_indices, ticket_count,
      reference_code, payment_method, payment_proof_url, order_total,
      status, reserved_at, reserved_until, sold_at,
      approved_at, approved_by, canceled_at, created_at
    ) VALUES (
      v_order_record.raffle_id,
      v_order_record.organization_id,
      v_order_record.buyer_id,
      v_order_record.buyer_name,
      v_order_record.buyer_email,
      v_order_record.buyer_phone,
      v_order_record.buyer_city,
      v_ranges,
      '{}',
      v_order_record.ticket_count,
      v_order_record.payment_reference,
      v_order_record.payment_method,
      v_order_record.payment_proof_url,
      v_order_record.order_total,
      v_order_record.status,
      v_order_record.reserved_at,
      v_order_record.reserved_until,
      v_order_record.sold_at,
      v_order_record.approved_at,
      v_order_record.approved_by,
      v_order_record.canceled_at,
      v_order_record.created_at
    )
    ON CONFLICT (reference_code) DO NOTHING;
    
    IF FOUND THEN
      v_orders_created := v_orders_created + 1;
      v_tickets_migrated := v_tickets_migrated + v_order_record.ticket_count;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_orders_created, v_tickets_migrated, NULL::TEXT;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT v_orders_created, v_tickets_migrated, SQLERRM;
END;
$$;