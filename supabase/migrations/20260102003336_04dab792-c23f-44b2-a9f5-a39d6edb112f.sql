-- Create atomic function for setting primary domain
CREATE OR REPLACE FUNCTION public.set_primary_domain(p_domain_id uuid, p_organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First, unset all primary domains for this organization
  UPDATE public.custom_domains 
  SET is_primary = false, updated_at = now()
  WHERE organization_id = p_organization_id 
    AND is_primary = true;
  
  -- Then, set the specified domain as primary
  UPDATE public.custom_domains 
  SET is_primary = true, updated_at = now()
  WHERE id = p_domain_id 
    AND organization_id = p_organization_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Domain not found or does not belong to organization';
  END IF;
  
  RETURN true;
END;
$$;