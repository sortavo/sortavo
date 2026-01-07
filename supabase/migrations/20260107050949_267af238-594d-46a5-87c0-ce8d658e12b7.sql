-- ==============================================
-- FIX CRÍTICO: Aumentar statement_timeout a 600s en funciones de generación
-- ==============================================

-- ============================================
-- FUNCIÓN V3: BULK INSERT con timeout de 10 minutos
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_ticket_batch_v3(
  p_raffle_id uuid, 
  p_start_index integer, 
  p_end_index integer, 
  p_numbering_config jsonb DEFAULT NULL::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout = '600s'
AS $function$
DECLARE
  v_mode TEXT;
  v_start_number INTEGER;
  v_step INTEGER;
  v_pad_enabled BOOLEAN;
  v_pad_width INTEGER;
  v_pad_char TEXT;
  v_prefix TEXT;
  v_suffix TEXT;
  v_separator TEXT;
  v_range_end INTEGER;
  v_total_tickets INTEGER;
  v_calculated_digits INTEGER;
  v_inserted INTEGER;
BEGIN
  -- Get raffle info and config
  SELECT total_tickets, COALESCE(numbering_config, p_numbering_config)
  INTO v_total_tickets, p_numbering_config
  FROM public.raffles
  WHERE id = p_raffle_id;
  
  -- Parse config with defaults
  v_mode := COALESCE(p_numbering_config->>'mode', 'sequential');
  v_start_number := COALESCE((p_numbering_config->>'start_number')::INTEGER, 1);
  v_step := COALESCE((p_numbering_config->>'step')::INTEGER, 1);
  v_pad_enabled := COALESCE((p_numbering_config->>'pad_enabled')::BOOLEAN, true);
  v_pad_width := (p_numbering_config->>'pad_width')::INTEGER;
  v_pad_char := COALESCE(p_numbering_config->>'pad_char', '0');
  v_prefix := p_numbering_config->>'prefix';
  v_suffix := p_numbering_config->>'suffix';
  v_separator := COALESCE(p_numbering_config->>'separator', '');
  v_range_end := (p_numbering_config->>'range_end')::INTEGER;
  
  -- Calculate padding width
  IF v_range_end IS NOT NULL THEN
    v_calculated_digits := LENGTH(v_range_end::TEXT);
  ELSE
    v_calculated_digits := LENGTH((v_start_number + (v_total_tickets - 1) * v_step)::TEXT);
  END IF;
  
  IF v_pad_width IS NULL THEN
    v_pad_width := GREATEST(3, v_calculated_digits);
  END IF;
  
  -- BULK INSERT using generate_series (20x faster than row-by-row loop)
  INSERT INTO public.tickets (raffle_id, ticket_index, ticket_number, status)
  SELECT 
    p_raffle_id,
    idx,
    -- Build ticket number string
    CASE WHEN v_prefix IS NOT NULL THEN v_prefix || v_separator ELSE '' END ||
    CASE WHEN v_pad_enabled 
      THEN LPAD((v_start_number + (idx - 1) * v_step)::TEXT, v_pad_width, v_pad_char)
      ELSE (v_start_number + (idx - 1) * v_step)::TEXT
    END ||
    CASE WHEN v_suffix IS NOT NULL THEN v_separator || v_suffix ELSE '' END,
    'available'
  FROM generate_series(p_start_index, p_end_index) AS idx
  ON CONFLICT (raffle_id, ticket_number) DO NOTHING;
  
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$function$;

-- ============================================
-- FUNCIÓN V2: Fallback con timeout de 10 minutos
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_ticket_batch_v2(
  p_raffle_id uuid, 
  p_start_index integer, 
  p_end_index integer, 
  p_numbering_config jsonb DEFAULT NULL::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout = '600s'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_mode TEXT;
  v_start_number INTEGER;
  v_step INTEGER;
  v_pad_enabled BOOLEAN;
  v_pad_width INTEGER;
  v_pad_char TEXT;
  v_prefix TEXT;
  v_suffix TEXT;
  v_separator TEXT;
  v_total_tickets INTEGER;
  v_calculated_digits INTEGER;
  v_range_end INTEGER;
  i INTEGER;
  v_ticket_number TEXT;
  v_display_number INTEGER;
  v_random_offset INTEGER;
BEGIN
  -- Get raffle info
  SELECT total_tickets, COALESCE(numbering_config, p_numbering_config)
  INTO v_total_tickets, p_numbering_config
  FROM public.raffles
  WHERE id = p_raffle_id;
  
  -- Parse config with defaults
  v_mode := COALESCE(p_numbering_config->>'mode', 'sequential');
  v_start_number := COALESCE((p_numbering_config->>'start_number')::INTEGER, 1);
  v_step := COALESCE((p_numbering_config->>'step')::INTEGER, 1);
  v_pad_enabled := COALESCE((p_numbering_config->>'pad_enabled')::BOOLEAN, true);
  v_pad_width := (p_numbering_config->>'pad_width')::INTEGER;
  v_pad_char := COALESCE(p_numbering_config->>'pad_char', '0');
  v_prefix := p_numbering_config->>'prefix';
  v_suffix := p_numbering_config->>'suffix';
  v_separator := COALESCE(p_numbering_config->>'separator', '');
  v_range_end := (p_numbering_config->>'range_end')::INTEGER;
  
  -- Calculate max number for padding calculation
  IF v_range_end IS NOT NULL THEN
    v_calculated_digits := LENGTH(v_range_end::TEXT);
  ELSE
    v_calculated_digits := LENGTH((v_start_number + (v_total_tickets - 1) * v_step)::TEXT);
  END IF;
  
  -- Use custom pad_width if specified, otherwise calculate
  IF v_pad_width IS NULL THEN
    v_pad_width := GREATEST(3, v_calculated_digits);
  END IF;
  
  -- For random_permutation mode, we need to use a deterministic seed
  IF v_mode = 'random_permutation' THEN
    PERFORM setseed(('0.' || abs(hashtext(p_raffle_id::TEXT)))::DOUBLE PRECISION);
  END IF;
  
  -- Generate tickets
  FOR i IN p_start_index..p_end_index LOOP
    -- Calculate display number based on mode
    IF v_mode = 'sequential' THEN
      v_display_number := v_start_number + (i - 1) * v_step;
    ELSIF v_mode = 'random_permutation' THEN
      v_display_number := v_start_number + (i - 1) * v_step;
    ELSE
      v_display_number := v_start_number + (i - 1) * v_step;
    END IF;
    
    -- Build ticket number string
    IF v_pad_enabled THEN
      v_ticket_number := LPAD(v_display_number::TEXT, v_pad_width, v_pad_char);
    ELSE
      v_ticket_number := v_display_number::TEXT;
    END IF;
    
    -- Add prefix and suffix
    IF v_prefix IS NOT NULL THEN
      v_ticket_number := v_prefix || v_separator || v_ticket_number;
    END IF;
    
    IF v_suffix IS NOT NULL THEN
      v_ticket_number := v_ticket_number || v_separator || v_suffix;
    END IF;
    
    -- Insert ticket
    INSERT INTO public.tickets (raffle_id, ticket_index, ticket_number, status)
    VALUES (p_raffle_id, i, v_ticket_number, 'available')
    ON CONFLICT (raffle_id, ticket_number) DO NOTHING;
    
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$function$;

-- ============================================
-- FUNCIÓN LEGACY: Timeout de 10 minutos
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_ticket_batch(
  p_raffle_id uuid, 
  p_start_number integer, 
  p_end_number integer, 
  p_format text DEFAULT 'sequential'::text, 
  p_prefix text DEFAULT NULL::text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout = '600s'
AS $function$
DECLARE
  v_count INTEGER;
  v_total_tickets INTEGER;
  v_digits INTEGER;
BEGIN
  -- Get total tickets for padding calculation
  SELECT total_tickets INTO v_total_tickets
  FROM public.raffles
  WHERE id = p_raffle_id;
  
  -- Calculate number of digits needed
  v_digits := GREATEST(3, LENGTH(v_total_tickets::TEXT));
  
  -- Insert batch of tickets
  INSERT INTO public.tickets (raffle_id, ticket_number, status)
  SELECT 
    p_raffle_id,
    CASE p_format
      WHEN 'prefixed' THEN COALESCE(p_prefix, 'TKT') || '-' || LPAD(n::TEXT, v_digits, '0')
      ELSE LPAD(n::TEXT, v_digits, '0')
    END,
    'available'
  FROM generate_series(p_start_number, p_end_number) AS n
  ON CONFLICT (raffle_id, ticket_number) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- ============================================
-- FUNCIÓN APPEND: Timeout de 10 minutos
-- ============================================
CREATE OR REPLACE FUNCTION public.append_ticket_batch(
  p_raffle_id uuid, 
  p_existing_count integer, 
  p_new_total integer, 
  p_numbering_config jsonb DEFAULT NULL::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout = '600s'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_start_index INTEGER;
  v_end_index INTEGER;
  v_mode TEXT;
  v_start_number INTEGER;
  v_step INTEGER;
  v_pad_enabled BOOLEAN;
  v_pad_width INTEGER;
  v_pad_char TEXT;
  v_prefix TEXT;
  v_suffix TEXT;
  v_separator TEXT;
  v_range_end INTEGER;
  v_calculated_digits INTEGER;
  i INTEGER;
  v_ticket_number TEXT;
  v_display_number INTEGER;
BEGIN
  -- Validate inputs
  IF p_new_total <= p_existing_count THEN
    RAISE EXCEPTION 'New total (%) must be greater than existing count (%)', p_new_total, p_existing_count;
  END IF;
  
  -- Get raffle config if not provided
  IF p_numbering_config IS NULL THEN
    SELECT numbering_config INTO p_numbering_config
    FROM public.raffles
    WHERE id = p_raffle_id;
  END IF;
  
  -- Set index range for new tickets
  v_start_index := p_existing_count + 1;
  v_end_index := p_new_total;
  
  -- Parse config with defaults
  v_mode := COALESCE(p_numbering_config->>'mode', 'sequential');
  v_start_number := COALESCE((p_numbering_config->>'start_number')::INTEGER, 1);
  v_step := COALESCE((p_numbering_config->>'step')::INTEGER, 1);
  v_pad_enabled := COALESCE((p_numbering_config->>'pad_enabled')::BOOLEAN, true);
  v_pad_width := (p_numbering_config->>'pad_width')::INTEGER;
  v_pad_char := COALESCE(p_numbering_config->>'pad_char', '0');
  v_prefix := p_numbering_config->>'prefix';
  v_suffix := p_numbering_config->>'suffix';
  v_separator := COALESCE(p_numbering_config->>'separator', '');
  v_range_end := (p_numbering_config->>'range_end')::INTEGER;
  
  -- Calculate max number for padding calculation (based on NEW total)
  IF v_range_end IS NOT NULL THEN
    v_calculated_digits := LENGTH(v_range_end::TEXT);
  ELSE
    v_calculated_digits := LENGTH((v_start_number + (p_new_total - 1) * v_step)::TEXT);
  END IF;
  
  -- Use custom pad_width if specified, otherwise calculate
  IF v_pad_width IS NULL THEN
    v_pad_width := GREATEST(3, v_calculated_digits);
  END IF;
  
  -- Generate new tickets (sequential only for append - random_permutation not supported for append)
  FOR i IN v_start_index..v_end_index LOOP
    -- Calculate display number based on index
    v_display_number := v_start_number + (i - 1) * v_step;
    
    -- Build ticket number string
    IF v_pad_enabled THEN
      v_ticket_number := LPAD(v_display_number::TEXT, v_pad_width, v_pad_char);
    ELSE
      v_ticket_number := v_display_number::TEXT;
    END IF;
    
    -- Add prefix and suffix
    IF v_prefix IS NOT NULL THEN
      v_ticket_number := v_prefix || v_separator || v_ticket_number;
    END IF;
    
    IF v_suffix IS NOT NULL THEN
      v_ticket_number := v_ticket_number || v_separator || v_suffix;
    END IF;
    
    -- Insert ticket
    INSERT INTO public.tickets (raffle_id, ticket_index, ticket_number, status)
    VALUES (p_raffle_id, i, v_ticket_number, 'available')
    ON CONFLICT (raffle_id, ticket_number) DO NOTHING;
    
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$function$;

-- ============================================
-- RESET JOBS FALLIDOS POR TIMEOUT
-- ============================================
UPDATE public.ticket_generation_jobs
SET 
  status = 'pending',
  started_at = NULL,
  completed_at = NULL,
  error_message = NULL
WHERE status = 'failed'
  AND (error_message LIKE '%timeout%' OR error_message LIKE '%57014%')
  AND created_at > NOW() - INTERVAL '14 days';

-- ============================================
-- VISTA DE MONITOREO EN TIEMPO REAL
-- ============================================
CREATE OR REPLACE VIEW public.active_generation_jobs AS
SELECT 
  j.id,
  r.title as raffle_title,
  j.total_tickets,
  j.generated_count,
  j.current_batch,
  j.total_batches,
  j.batch_size,
  ROUND((j.generated_count::NUMERIC / NULLIF(j.total_tickets, 0) * 100), 2) as progress_pct,
  j.status,
  j.started_at,
  AGE(NOW(), j.started_at) as elapsed,
  -- ETA calculation
  CASE 
    WHEN j.generated_count > 0 AND j.status = 'running' AND j.started_at IS NOT NULL
    THEN ROUND((
      EXTRACT(EPOCH FROM AGE(NOW(), j.started_at))::NUMERIC / 
      NULLIF(j.generated_count, 0) * 
      (j.total_tickets - j.generated_count)
    )::NUMERIC, 0)::TEXT || ' seconds'
    ELSE NULL
  END as eta_remaining,
  j.error_message
FROM public.ticket_generation_jobs j
JOIN public.raffles r ON r.id = j.raffle_id
WHERE j.status IN ('pending', 'running')
ORDER BY j.started_at DESC NULLS LAST;