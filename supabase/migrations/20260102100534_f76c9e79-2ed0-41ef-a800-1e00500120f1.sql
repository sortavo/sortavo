-- Function to append new tickets to an existing raffle (without affecting existing tickets)
CREATE OR REPLACE FUNCTION public.append_ticket_batch(
  p_raffle_id UUID,
  p_existing_count INTEGER,
  p_new_total INTEGER,
  p_numbering_config JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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