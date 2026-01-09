-- Índice para acelerar búsquedas de órdenes activas por rifa
CREATE INDEX IF NOT EXISTS idx_orders_raffle_status_active 
ON orders (raffle_id, status) 
WHERE status IN ('reserved', 'pending', 'sold');

-- Función optimizada para verificar disponibilidad de índices
CREATE OR REPLACE FUNCTION public.check_indices_available(
  p_raffle_id UUID,
  p_indices INTEGER[]
)
RETURNS TABLE(
  available BOOLEAN,
  conflicting_indices INTEGER[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_idx INTEGER;
  v_max_idx INTEGER;
  conflicts INTEGER[] := '{}';
BEGIN
  -- Obtener rango de índices solicitados para filtrar órdenes relevantes
  SELECT MIN(idx), MAX(idx) INTO v_min_idx, v_max_idx FROM unnest(p_indices) idx;
  
  -- Verificar conflictos directamente contra rangos SIN expandir todo
  SELECT array_agg(DISTINCT conflicting_idx) INTO conflicts
  FROM (
    -- Conflictos con lucky_indices (verificación directa con array overlap)
    SELECT unnest(o.lucky_indices) as conflicting_idx
    FROM orders o
    WHERE o.raffle_id = p_raffle_id 
      AND o.status IN ('reserved', 'pending', 'sold')
      AND o.lucky_indices && p_indices
    
    UNION ALL
    
    -- Conflictos con rangos (solo expandir rangos que se intersectan)
    SELECT x as conflicting_idx
    FROM orders o,
         jsonb_array_elements(o.ticket_ranges) r,
         generate_series(
           GREATEST((r.value->>'s')::INT, v_min_idx),
           LEAST((r.value->>'e')::INT, v_max_idx)
         ) x
    WHERE o.raffle_id = p_raffle_id 
      AND o.status IN ('reserved', 'pending', 'sold')
      AND (r.value->>'s')::INT <= v_max_idx
      AND (r.value->>'e')::INT >= v_min_idx
      AND x = ANY(p_indices)
  ) all_conflicts;
  
  RETURN QUERY SELECT 
    (conflicts IS NULL OR array_length(conflicts, 1) IS NULL),
    COALESCE(conflicts, '{}');
END;
$$;

-- Timeout más alto para reservas grandes
ALTER FUNCTION reserve_tickets_v2 SET statement_timeout = '30s';