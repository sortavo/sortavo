-- Add prizes JSONB column to store multiple prizes
ALTER TABLE public.raffles 
ADD COLUMN IF NOT EXISTS prizes JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.raffles.prizes IS 'Array of prize objects: [{id, name, value?, currency?}]. First prize syncs with prize_name/prize_value for compatibility.';