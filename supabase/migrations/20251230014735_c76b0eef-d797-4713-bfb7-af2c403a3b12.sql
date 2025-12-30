-- Create telegram_connections table (for organizers)
CREATE TABLE public.telegram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL,
  telegram_username TEXT,
  link_code TEXT,
  link_code_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Customizable notification preferences for organizers
  notify_ticket_reserved BOOLEAN DEFAULT true,
  notify_payment_proof BOOLEAN DEFAULT true,
  notify_payment_approved BOOLEAN DEFAULT false,
  notify_payment_rejected BOOLEAN DEFAULT false,
  notify_reservation_expired BOOLEAN DEFAULT false,
  notify_raffle_ending BOOLEAN DEFAULT true,
  notify_daily_summary BOOLEAN DEFAULT false,
  daily_summary_hour INTEGER DEFAULT 20,
  notify_winner_selected BOOLEAN DEFAULT true,
  
  UNIQUE(organization_id),
  UNIQUE(telegram_chat_id)
);

-- Create telegram_buyer_links table (for buyers)
CREATE TABLE public.telegram_buyer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  telegram_chat_id TEXT NOT NULL,
  telegram_username TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Customizable notification preferences for buyers
  notify_reservation BOOLEAN DEFAULT true,
  notify_payment_reminder BOOLEAN DEFAULT true,
  notify_payment_approved BOOLEAN DEFAULT true,
  notify_payment_rejected BOOLEAN DEFAULT true,
  notify_draw_reminder BOOLEAN DEFAULT true,
  notify_winner BOOLEAN DEFAULT true,
  notify_announcements BOOLEAN DEFAULT true,
  
  UNIQUE(buyer_email),
  UNIQUE(telegram_chat_id)
);

-- Enable RLS on both tables
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_buyer_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_connections (organizers)
CREATE POLICY "Org admins can view their telegram connection"
  ON public.telegram_connections
  FOR SELECT
  USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert their telegram connection"
  ON public.telegram_connections
  FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update their telegram connection"
  ON public.telegram_connections
  FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete their telegram connection"
  ON public.telegram_connections
  FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id));

-- RLS Policies for telegram_buyer_links (buyers - public insert for linking)
CREATE POLICY "Anyone can insert buyer telegram link"
  ON public.telegram_buyer_links
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update buyer telegram link by email"
  ON public.telegram_buyer_links
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can view buyer telegram link by email"
  ON public.telegram_buyer_links
  FOR SELECT
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_telegram_connections_updated_at
  BEFORE UPDATE ON public.telegram_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telegram_buyer_links_updated_at
  BEFORE UPDATE ON public.telegram_buyer_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_telegram_connections_org ON public.telegram_connections(organization_id);
CREATE INDEX idx_telegram_connections_link_code ON public.telegram_connections(link_code) WHERE link_code IS NOT NULL;
CREATE INDEX idx_telegram_buyer_links_email ON public.telegram_buyer_links(buyer_email);
CREATE INDEX idx_telegram_buyer_links_chat_id ON public.telegram_buyer_links(telegram_chat_id);