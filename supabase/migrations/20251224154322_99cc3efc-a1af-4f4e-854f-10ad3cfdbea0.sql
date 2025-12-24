-- Add winner_announced column to raffles table
ALTER TABLE public.raffles 
ADD COLUMN IF NOT EXISTS winner_announced boolean DEFAULT false;