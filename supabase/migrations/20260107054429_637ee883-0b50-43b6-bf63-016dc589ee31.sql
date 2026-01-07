-- ============================================
-- OPTIMIZACIONES FINALES RESTANTES
-- ============================================

-- 1. Función alias con nombre más descriptivo
CREATE OR REPLACE FUNCTION public.refresh_raffle_stats_now()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.raffle_stats_mv;
  RAISE NOTICE 'Vista raffle_stats_mv refrescada en %', NOW();
END;
$$;

-- 2. Configurar autovacuum para ticket_generation_jobs
ALTER TABLE public.ticket_generation_jobs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- 3. Parámetros adicionales de performance para tickets
ALTER TABLE public.tickets SET (
  autovacuum_vacuum_cost_delay = 10,
  autovacuum_vacuum_cost_limit = 1000
);

-- 4. Grants para funciones helper
GRANT EXECUTE ON FUNCTION public.get_optimal_batch_size(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_non_critical_ticket_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_non_critical_ticket_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_raffle_stats_mv() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_raffle_stats_now() TO authenticated;