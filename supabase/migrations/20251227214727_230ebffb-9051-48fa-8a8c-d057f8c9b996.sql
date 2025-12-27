-- =====================================================
-- Índices optimizados para 10 millones de boletos
-- =====================================================

-- Índice para búsqueda por ticket_number (soporta ILIKE con prefijo)
-- Usamos btree_gin para búsquedas eficientes por prefijo
CREATE INDEX IF NOT EXISTS idx_tickets_number_pattern 
ON public.tickets (raffle_id, ticket_number);

-- Índice para selección aleatoria de boletos disponibles
CREATE INDEX IF NOT EXISTS idx_tickets_raffle_available 
ON public.tickets (raffle_id, status) 
WHERE status = 'available';

-- Índice para conteos rápidos por status
CREATE INDEX IF NOT EXISTS idx_tickets_raffle_status_btree 
ON public.tickets (raffle_id, status);

-- Índice para búsqueda de boletos por email del comprador
CREATE INDEX IF NOT EXISTS idx_tickets_buyer_email 
ON public.tickets (buyer_email) 
WHERE buyer_email IS NOT NULL;