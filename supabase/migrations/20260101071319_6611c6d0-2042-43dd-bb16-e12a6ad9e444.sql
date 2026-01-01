-- Create custom_domains table for multi-tenant domain mapping
CREATE TABLE public.custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  verification_token TEXT DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  verification_method TEXT DEFAULT 'dns_txt',
  ssl_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster domain lookups
CREATE INDEX idx_custom_domains_domain ON public.custom_domains(domain);
CREATE INDEX idx_custom_domains_org ON public.custom_domains(organization_id);

-- Enable RLS
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org admins can manage their domains"
ON public.custom_domains
FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Public can lookup verified domains"
ON public.custom_domains
FOR SELECT
USING (verified = true);

-- Add white-label branding fields to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS custom_css TEXT,
ADD COLUMN IF NOT EXISTS white_label_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS powered_by_visible BOOLEAN DEFAULT true;

-- Create function to lookup tenant by domain
CREATE OR REPLACE FUNCTION public.get_organization_by_domain(p_domain TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  brand_color TEXT,
  favicon_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  custom_css TEXT,
  white_label_enabled BOOLEAN,
  powered_by_visible BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.logo_url,
    o.brand_color,
    o.favicon_url,
    o.meta_title,
    o.meta_description,
    o.custom_css,
    o.white_label_enabled,
    o.powered_by_visible
  FROM public.organizations o
  INNER JOIN public.custom_domains cd ON cd.organization_id = o.id
  WHERE cd.domain = LOWER(p_domain)
    AND cd.verified = true
  LIMIT 1;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_custom_domains_updated_at
BEFORE UPDATE ON public.custom_domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();