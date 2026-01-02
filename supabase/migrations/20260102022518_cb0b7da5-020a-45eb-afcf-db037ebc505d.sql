-- Add index for efficient domain count queries per organization
CREATE INDEX IF NOT EXISTS idx_custom_domains_org_count 
ON public.custom_domains(organization_id);