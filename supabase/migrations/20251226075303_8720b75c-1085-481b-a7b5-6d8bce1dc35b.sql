-- Add cover_media column for multiple images/videos
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS cover_media jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN public.organizations.cover_media IS 'Array of media objects: [{ "type": "image"|"video", "url": "string", "order": number }]';