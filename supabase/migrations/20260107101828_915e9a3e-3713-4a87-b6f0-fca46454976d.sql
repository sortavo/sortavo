-- PASO 2: Optimizar Dashboard (índices sin CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_raffles_org_created_not_archived
ON public.raffles (organization_id, created_at DESC)
WHERE archived_at IS NULL;

-- Extensión y índice para búsqueda por título (ILIKE)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_raffles_title_trgm_not_archived
ON public.raffles USING gin (title gin_trgm_ops)
WHERE archived_at IS NULL;

-- PASO 3A: Función claim_next_job con SKIP LOCKED
CREATE OR REPLACE FUNCTION claim_next_job(p_worker_id TEXT, p_limit INTEGER DEFAULT 1)
RETURNS TABLE(
  id UUID,
  raffle_id UUID,
  total_tickets INTEGER,
  generated_count INTEGER,
  current_batch INTEGER,
  batch_size INTEGER,
  numbering_config JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE ticket_generation_jobs
  SET 
    status = 'running',
    started_at = COALESCE(started_at, NOW())
  WHERE ticket_generation_jobs.id IN (
    SELECT tj.id
    FROM ticket_generation_jobs tj
    WHERE tj.status = 'pending'
    ORDER BY tj.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    ticket_generation_jobs.id,
    ticket_generation_jobs.raffle_id,
    ticket_generation_jobs.total_tickets,
    ticket_generation_jobs.generated_count,
    ticket_generation_jobs.current_batch,
    ticket_generation_jobs.batch_size,
    ticket_generation_jobs.numbering_config;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_next_job TO authenticated, service_role;