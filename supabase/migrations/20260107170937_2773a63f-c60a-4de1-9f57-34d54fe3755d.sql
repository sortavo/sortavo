-- =====================================================
-- FIX: Create raffle_stats_mv Materialized View for Virtual Tickets
-- =====================================================

-- Create the materialized view that the dashboard RPCs depend on
CREATE MATERIALIZED VIEW IF NOT EXISTS public.raffle_stats_mv AS
SELECT 
  r.id AS raffle_id,
  r.organization_id,
  r.title,
  r.status,
  r.total_tickets,
  r.ticket_price,
  r.draw_date,
  r.created_at,
  -- Ticket counts from sold_tickets (virtual model)
  COALESCE(stats.sold_count, 0)::BIGINT AS sold_count,
  COALESCE(stats.reserved_count, 0)::BIGINT AS reserved_count,
  -- Available = total - sold - active_reserved (virtual model)
  (r.total_tickets - COALESCE(stats.sold_count, 0) - COALESCE(stats.active_reserved_count, 0))::BIGINT AS available_count,
  -- For backwards compat, total_tickets_in_db = total_tickets (in virtual model)
  r.total_tickets::BIGINT AS total_tickets_in_db,
  -- Revenue from order_total grouped by payment_reference
  COALESCE(stats.revenue_from_orders, 0)::NUMERIC AS revenue_from_orders,
  -- Unique buyers
  COALESCE(stats.unique_buyers, 0)::BIGINT AS unique_buyers,
  -- Last sale timestamp
  stats.last_sale_at
FROM public.raffles r
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE st.status = 'sold') AS sold_count,
    COUNT(*) FILTER (WHERE st.status = 'reserved') AS reserved_count,
    COUNT(*) FILTER (WHERE st.status = 'reserved' AND st.reserved_until >= NOW()) AS active_reserved_count,
    COUNT(DISTINCT st.buyer_email) FILTER (WHERE st.status = 'sold') AS unique_buyers,
    MAX(st.sold_at) AS last_sale_at,
    -- Sum order_total grouped by payment_reference to avoid double counting
    (
      SELECT COALESCE(SUM(sub.order_total), 0)
      FROM (
        SELECT DISTINCT ON (payment_reference) order_total
        FROM public.sold_tickets
        WHERE raffle_id = r.id AND status = 'sold' AND payment_reference IS NOT NULL
      ) sub
    ) AS revenue_from_orders
  FROM public.sold_tickets st
  WHERE st.raffle_id = r.id
) stats ON true
WHERE r.archived_at IS NULL;

-- Create unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_raffle_stats_mv_raffle_id 
ON public.raffle_stats_mv (raffle_id);

-- Create supporting indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_raffle_stats_mv_org_status 
ON public.raffle_stats_mv (organization_id, status);

-- Grant access
GRANT SELECT ON public.raffle_stats_mv TO authenticated;
GRANT SELECT ON public.raffle_stats_mv TO anon;

-- Update the dashboard RPCs to use raffle.total_tickets instead of total_tickets_in_db for available calculation
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_organization_id uuid)
RETURNS TABLE(
  active_raffles bigint,
  total_revenue numeric,
  tickets_sold numeric,
  total_tickets numeric,
  pending_approvals numeric,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE rs.status = 'active')::BIGINT as active_raffles,
    COALESCE(SUM(
      CASE 
        WHEN rs.revenue_from_orders > 0 THEN rs.revenue_from_orders
        ELSE rs.sold_count * rs.ticket_price
      END
    ), 0)::NUMERIC as total_revenue,
    COALESCE(SUM(rs.sold_count), 0)::NUMERIC as tickets_sold,
    COALESCE(SUM(rs.total_tickets), 0)::NUMERIC as total_tickets,
    COALESCE(SUM(rs.reserved_count), 0)::NUMERIC as pending_approvals,
    CASE 
      WHEN SUM(rs.total_tickets) > 0 
      THEN ROUND((SUM(rs.sold_count)::NUMERIC / SUM(rs.total_tickets)) * 100, 1)
      ELSE 0 
    END as conversion_rate
  FROM public.raffle_stats_mv rs
  WHERE rs.organization_id = p_organization_id
    AND rs.status IN ('active', 'paused');
END;
$$;

-- Update get_raffle_stats_list to use total_tickets from raffles table
CREATE OR REPLACE FUNCTION public.get_raffle_stats_list(p_organization_id uuid)
RETURNS TABLE(
  raffle_id uuid,
  sold_count bigint,
  reserved_count bigint,
  available_count bigint,
  revenue numeric,
  unique_buyers bigint,
  last_sale_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.raffle_id,
    rs.sold_count,
    rs.reserved_count,
    -- Recalculate available from total_tickets (virtual model)
    (rs.total_tickets - rs.sold_count - rs.reserved_count)::BIGINT as available_count,
    CASE 
      WHEN rs.revenue_from_orders > 0 THEN rs.revenue_from_orders
      ELSE (rs.sold_count * rs.ticket_price)::NUMERIC
    END as revenue,
    rs.unique_buyers,
    rs.last_sale_at
  FROM public.raffle_stats_mv rs
  WHERE rs.organization_id = p_organization_id
    AND rs.status IN ('active', 'paused');
END;
$$;