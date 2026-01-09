-- Dropear función existente para cambiar return type
DROP FUNCTION IF EXISTS get_raffle_stats_list(UUID);

-- Modificar get_dashboard_stats para consultar directamente la tabla orders
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_organization_id UUID)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_raffles', COUNT(DISTINCT r.id),
    'active_raffles', COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END),
    'total_tickets_sold', COALESCE(SUM(
      CASE WHEN o.status = 'sold' THEN o.ticket_count ELSE 0 END
    ), 0),
    'total_revenue', COALESCE(SUM(
      CASE WHEN o.status = 'sold' THEN o.order_total ELSE 0 END
    ), 0)
  )
  FROM raffles r
  LEFT JOIN orders o ON o.raffle_id = r.id
  WHERE r.organization_id = p_organization_id
    AND r.archived_at IS NULL;
$$;

-- Recrear get_raffle_stats_list para consultar directamente
CREATE OR REPLACE FUNCTION get_raffle_stats_list(p_organization_id UUID)
RETURNS TABLE(
  raffle_id UUID,
  tickets_sold BIGINT,
  tickets_reserved BIGINT,
  total_revenue NUMERIC,
  unique_buyers BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id as raffle_id,
    COALESCE(SUM(CASE WHEN o.status = 'sold' THEN o.ticket_count ELSE 0 END), 0)::BIGINT as tickets_sold,
    COALESCE(SUM(CASE WHEN o.status = 'reserved' THEN o.ticket_count ELSE 0 END), 0)::BIGINT as tickets_reserved,
    COALESCE(SUM(CASE WHEN o.status = 'sold' THEN o.order_total ELSE 0 END), 0) as total_revenue,
    COUNT(DISTINCT CASE WHEN o.status = 'sold' THEN o.buyer_email END)::BIGINT as unique_buyers
  FROM raffles r
  LEFT JOIN orders o ON o.raffle_id = r.id
  WHERE r.organization_id = p_organization_id
    AND r.archived_at IS NULL
    AND r.status IN ('active', 'completed')
  GROUP BY r.id;
$$;