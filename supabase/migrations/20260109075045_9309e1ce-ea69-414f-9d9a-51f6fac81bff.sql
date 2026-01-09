-- Drop and recreate get_dashboard_charts with correct field names
DROP FUNCTION IF EXISTS get_dashboard_charts(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_dashboard_charts(
  p_org_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_period_days INT;
  v_prev_start TIMESTAMPTZ;
  v_prev_end TIMESTAMPTZ;
BEGIN
  -- Calculate period length for previous period comparison
  v_period_days := GREATEST(EXTRACT(DAY FROM (p_end_date - p_start_date))::INT, 1);
  v_prev_end := p_start_date - INTERVAL '1 second';
  v_prev_start := p_start_date - (v_period_days || ' days')::INTERVAL;

  WITH daily_revenue AS (
    SELECT 
      DATE(o.sold_at AT TIME ZONE 'America/Mexico_City') as date,
      COALESCE(SUM(o.order_total), 0) as revenue,
      COALESCE(SUM(o.ticket_count), 0) as tickets
    FROM orders o
    JOIN raffles r ON r.id = o.raffle_id
    WHERE r.organization_id = p_org_id 
      AND o.status = 'sold'
      AND o.sold_at >= p_start_date 
      AND o.sold_at <= p_end_date
    GROUP BY DATE(o.sold_at AT TIME ZONE 'America/Mexico_City')
    ORDER BY date
  ),
  raffle_sales AS (
    SELECT 
      r.id,
      r.title as name,
      COALESCE(SUM(CASE WHEN o.status = 'sold' THEN o.ticket_count ELSE 0 END), 0) as sold,
      r.total_tickets - COALESCE(SUM(CASE WHEN o.status IN ('sold', 'reserved') THEN o.ticket_count ELSE 0 END), 0) as available,
      r.total_tickets as total,
      COALESCE(SUM(CASE WHEN o.status = 'sold' THEN o.order_total ELSE 0 END), 0) as revenue,
      r.ticket_price
    FROM raffles r
    LEFT JOIN orders o ON o.raffle_id = r.id
    WHERE r.organization_id = p_org_id 
      AND r.archived_at IS NULL
    GROUP BY r.id, r.title, r.total_tickets, r.ticket_price
    ORDER BY sold DESC
  ),
  period_totals AS (
    SELECT 
      COALESCE(SUM(o.ticket_count), 0) as tickets_sold,
      COALESCE(SUM(o.order_total), 0) as revenue
    FROM orders o
    JOIN raffles r ON r.id = o.raffle_id
    WHERE r.organization_id = p_org_id 
      AND o.status = 'sold'
      AND o.sold_at >= p_start_date 
      AND o.sold_at <= p_end_date
  ),
  previous_totals AS (
    SELECT 
      COALESCE(SUM(o.ticket_count), 0) as tickets_sold,
      COALESCE(SUM(o.order_total), 0) as revenue
    FROM orders o
    JOIN raffles r ON r.id = o.raffle_id
    WHERE r.organization_id = p_org_id 
      AND o.status = 'sold'
      AND o.sold_at >= v_prev_start 
      AND o.sold_at <= v_prev_end
  )
  SELECT jsonb_build_object(
    'daily_revenue', COALESCE((SELECT jsonb_agg(row_to_json(dr)) FROM daily_revenue dr), '[]'::jsonb),
    'raffle_sales', COALESCE((SELECT jsonb_agg(row_to_json(rs)) FROM raffle_sales rs), '[]'::jsonb),
    'period_totals', (SELECT row_to_json(pt) FROM period_totals pt),
    'previous_totals', (SELECT row_to_json(pv) FROM previous_totals pv)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;