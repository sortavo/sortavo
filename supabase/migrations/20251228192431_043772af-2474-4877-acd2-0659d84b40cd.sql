-- ===========================================
-- TICKET NUMBERING CONFIGURATION SYSTEM
-- ===========================================

-- 1. Add ticket_index to tickets table (stable internal identifier)
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS ticket_index INTEGER;

-- 2. Add numbering configuration to raffles table
ALTER TABLE public.raffles
ADD COLUMN IF NOT EXISTS numbering_config JSONB DEFAULT '{
  "mode": "sequential",
  "start_number": 1,
  "step": 1,
  "pad_enabled": true,
  "pad_width": null,
  "pad_char": "0",
  "prefix": null,
  "suffix": null,
  "separator": "",
  "range_end": null,
  "custom_numbers": null
}'::jsonb;

-- 3. Backfill ticket_index for existing tickets (based on creation order within each raffle)
UPDATE public.tickets t
SET ticket_index = subq.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY raffle_id ORDER BY created_at, id) as row_num
  FROM public.tickets
) subq
WHERE t.id = subq.id AND t.ticket_index IS NULL;

-- 4. Make ticket_index NOT NULL after backfill (for new tickets it will be required)
-- Note: We'll handle this constraint in application logic for now to avoid breaking existing flows

-- 5. Add unique constraint for ticket_index per raffle
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_raffle_ticket_index 
ON public.tickets(raffle_id, ticket_index) 
WHERE ticket_index IS NOT NULL;

-- 6. Add index for efficient sorting by ticket_index
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_index 
ON public.tickets(raffle_id, ticket_index);

-- 7. Create table for custom number lists (CSV uploads)
CREATE TABLE IF NOT EXISTS public.raffle_custom_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  ticket_index INTEGER NOT NULL,
  custom_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(raffle_id, ticket_index),
  UNIQUE(raffle_id, custom_number)
);

-- 8. Enable RLS on custom numbers table
ALTER TABLE public.raffle_custom_numbers ENABLE ROW LEVEL SECURITY;

-- 9. RLS policies for custom numbers
CREATE POLICY "Org members can manage custom numbers" 
ON public.raffle_custom_numbers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.raffles r 
  WHERE r.id = raffle_custom_numbers.raffle_id 
  AND has_org_access(auth.uid(), r.organization_id)
));

-- 10. Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_custom_numbers_raffle_index 
ON public.raffle_custom_numbers(raffle_id, ticket_index);

-- ===========================================
-- UPDATED TICKET GENERATION FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.generate_ticket_batch_v2(
  p_raffle_id UUID,
  p_start_index INTEGER,
  p_end_index INTEGER,
  p_numbering_config JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  v_pad_width := (p_numbering_config->>'pad_width')::INTEGER; -- Can be NULL
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
    -- Use raffle_id as seed for reproducible randomness
    PERFORM setseed(('0.' || abs(hashtext(p_raffle_id::TEXT)))::DOUBLE PRECISION);
  END IF;
  
  -- Generate tickets
  FOR i IN p_start_index..p_end_index LOOP
    -- Calculate display number based on mode
    IF v_mode = 'sequential' THEN
      v_display_number := v_start_number + (i - 1) * v_step;
    ELSIF v_mode = 'random_permutation' THEN
      -- For random permutation, we'll assign the actual number later via update
      -- For now, use index as placeholder
      v_display_number := v_start_number + (i - 1) * v_step;
    ELSE
      -- Default to sequential
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

-- ===========================================
-- FUNCTION TO APPLY RANDOM PERMUTATION
-- ===========================================

CREATE OR REPLACE FUNCTION public.apply_random_permutation(
  p_raffle_id UUID,
  p_numbering_config JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total INTEGER;
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
BEGIN
  -- Get raffle config
  SELECT COALESCE(numbering_config, p_numbering_config), total_tickets
  INTO p_numbering_config, v_total
  FROM public.raffles
  WHERE id = p_raffle_id;
  
  -- Parse config
  v_start_number := COALESCE((p_numbering_config->>'start_number')::INTEGER, 1);
  v_step := COALESCE((p_numbering_config->>'step')::INTEGER, 1);
  v_pad_enabled := COALESCE((p_numbering_config->>'pad_enabled')::BOOLEAN, true);
  v_pad_width := (p_numbering_config->>'pad_width')::INTEGER;
  v_pad_char := COALESCE(p_numbering_config->>'pad_char', '0');
  v_prefix := p_numbering_config->>'prefix';
  v_suffix := p_numbering_config->>'suffix';
  v_separator := COALESCE(p_numbering_config->>'separator', '');
  v_range_end := (p_numbering_config->>'range_end')::INTEGER;
  
  -- Calculate padding
  IF v_range_end IS NOT NULL THEN
    v_calculated_digits := LENGTH(v_range_end::TEXT);
  ELSE
    v_calculated_digits := LENGTH((v_start_number + (v_total - 1) * v_step)::TEXT);
  END IF;
  
  IF v_pad_width IS NULL THEN
    v_pad_width := GREATEST(3, v_calculated_digits);
  END IF;
  
  -- Use deterministic seed based on raffle_id
  PERFORM setseed(('0.' || abs(hashtext(p_raffle_id::TEXT)))::DOUBLE PRECISION);
  
  -- Create temp table with shuffled numbers
  CREATE TEMP TABLE temp_shuffled_numbers AS
  SELECT 
    ticket_index,
    (v_start_number + (ROW_NUMBER() OVER (ORDER BY random()) - 1) * v_step) as display_number
  FROM public.tickets
  WHERE raffle_id = p_raffle_id;
  
  -- Update tickets with shuffled numbers
  UPDATE public.tickets t
  SET ticket_number = (
    SELECT 
      CASE 
        WHEN v_prefix IS NOT NULL THEN v_prefix || v_separator ELSE '' 
      END ||
      CASE 
        WHEN v_pad_enabled THEN LPAD(s.display_number::TEXT, v_pad_width, v_pad_char)
        ELSE s.display_number::TEXT
      END ||
      CASE 
        WHEN v_suffix IS NOT NULL THEN v_separator || v_suffix ELSE '' 
      END
    FROM temp_shuffled_numbers s
    WHERE s.ticket_index = t.ticket_index
  )
  WHERE t.raffle_id = p_raffle_id;
  
  DROP TABLE temp_shuffled_numbers;
  
  GET DIAGNOSTICS v_total = ROW_COUNT;
  RETURN v_total;
END;
$function$;

-- ===========================================
-- FUNCTION TO APPLY CUSTOM NUMBER LIST
-- ===========================================

CREATE OR REPLACE FUNCTION public.apply_custom_numbers(
  p_raffle_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  -- Update tickets with custom numbers from raffle_custom_numbers table
  UPDATE public.tickets t
  SET ticket_number = c.custom_number
  FROM public.raffle_custom_numbers c
  WHERE t.raffle_id = p_raffle_id
    AND t.raffle_id = c.raffle_id
    AND t.ticket_index = c.ticket_index;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- ===========================================
-- HELPER FUNCTION TO PREVIEW NUMBERS
-- ===========================================

CREATE OR REPLACE FUNCTION public.preview_ticket_numbers(
  p_numbering_config JSONB,
  p_total_tickets INTEGER,
  p_preview_count INTEGER DEFAULT 10
)
RETURNS TABLE(ticket_index INTEGER, ticket_number TEXT)
LANGUAGE plpgsql
SET search_path TO 'public'
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
  v_calculated_digits INTEGER;
  v_display_number INTEGER;
  v_ticket_number TEXT;
  i INTEGER;
BEGIN
  -- Parse config
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
  
  -- Calculate padding
  IF v_range_end IS NOT NULL THEN
    v_calculated_digits := LENGTH(v_range_end::TEXT);
  ELSE
    v_calculated_digits := LENGTH((v_start_number + (p_total_tickets - 1) * v_step)::TEXT);
  END IF;
  
  IF v_pad_width IS NULL THEN
    v_pad_width := GREATEST(3, v_calculated_digits);
  END IF;
  
  -- Generate preview
  FOR i IN 1..LEAST(p_preview_count, p_total_tickets) LOOP
    v_display_number := v_start_number + (i - 1) * v_step;
    
    IF v_pad_enabled THEN
      v_ticket_number := LPAD(v_display_number::TEXT, v_pad_width, v_pad_char);
    ELSE
      v_ticket_number := v_display_number::TEXT;
    END IF;
    
    IF v_prefix IS NOT NULL THEN
      v_ticket_number := v_prefix || v_separator || v_ticket_number;
    END IF;
    
    IF v_suffix IS NOT NULL THEN
      v_ticket_number := v_ticket_number || v_separator || v_suffix;
    END IF;
    
    ticket_index := i;
    ticket_number := v_ticket_number;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$function$;