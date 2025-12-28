-- Add order_total column to tickets table to persist discounted amounts
ALTER TABLE public.tickets ADD COLUMN order_total numeric NULL;