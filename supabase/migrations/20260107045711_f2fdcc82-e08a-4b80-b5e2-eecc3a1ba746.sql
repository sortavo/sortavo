-- ==============================================
-- FIX 1: Corregir RPC get_dashboard_stats (tipos NUMERIC)
-- ==============================================
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_organization_id uuid)
RETURNS TABLE(
  active_raffles BIGINT,
  total_revenue NUMERIC,
  tickets_sold NUMERIC,
  total_tickets NUMERIC,
  pending_approvals NUMERIC,
  conversion_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE rs.status = 'active')::BIGINT as active_raffles,
    COALESCE(SUM(rs.revenue_from_orders + (rs.sold_count * rs.ticket_price) - rs.revenue_from_orders), 0)::NUMERIC as total_revenue,
    COALESCE(SUM(rs.sold_count), 0)::NUMERIC as tickets_sold,
    COALESCE(SUM(rs.total_tickets_in_db), 0)::NUMERIC as total_tickets,
    COALESCE(SUM(rs.reserved_count), 0)::NUMERIC as pending_approvals,
    CASE 
      WHEN SUM(rs.total_tickets_in_db) > 0 
      THEN ROUND((SUM(rs.sold_count)::NUMERIC / SUM(rs.total_tickets_in_db)) * 100, 1)
      ELSE 0 
    END as conversion_rate
  FROM public.raffle_stats_mv rs
  WHERE rs.organization_id = p_organization_id
    AND rs.status IN ('active', 'paused');
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid) TO authenticated;

-- ==============================================
-- FIX 2: Cron para refresh de vista materializada (cada 5 min)
-- ==============================================
SELECT cron.schedule(
  'refresh-raffle-stats-mv',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY raffle_stats_mv$$
);

-- ==============================================
-- FIX 3: Limpieza de índices sin usar (~370 MB ahorro)
-- ==============================================
DROP INDEX IF EXISTS idx_tickets_available_covering;
DROP INDEX IF EXISTS idx_tickets_raffle_number;
DROP INDEX IF EXISTS idx_tickets_buyer_email_reserved;
DROP INDEX IF EXISTS idx_tickets_buyer_lookup;
DROP INDEX IF EXISTS idx_tickets_buyer_email;
DROP INDEX IF EXISTS idx_tickets_buyer_phone;
DROP INDEX IF EXISTS idx_tickets_buyer_email_lookup;
DROP INDEX IF EXISTS idx_tickets_buyer_phone_lookup;

-- ==============================================
-- FIX 4: Cron para archivado automático (3 AM diario)
-- ==============================================
SELECT cron.schedule(
  'archive-completed-raffles',
  '0 3 * * *',
  $$SELECT archive_old_raffles(90)$$
);