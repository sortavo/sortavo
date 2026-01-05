-- Create helper function to get minimum ticket number by parsing ticket_number
-- This is needed when ticket_index is NULL for legacy tickets
CREATE OR REPLACE FUNCTION get_min_ticket_number(p_raffle_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT MIN(CAST(ticket_number AS INTEGER))
  FROM tickets
  WHERE raffle_id = p_raffle_id
    AND ticket_number ~ '^\d+$';
$$;