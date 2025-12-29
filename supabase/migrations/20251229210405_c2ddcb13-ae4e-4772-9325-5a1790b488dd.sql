-- Add indexes for buyer search optimization
CREATE INDEX IF NOT EXISTS idx_tickets_buyer_email 
ON public.tickets(raffle_id, buyer_email) 
WHERE buyer_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_buyer_phone 
ON public.tickets(raffle_id, buyer_phone) 
WHERE buyer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_buyer_name 
ON public.tickets(raffle_id, buyer_name) 
WHERE buyer_name IS NOT NULL;