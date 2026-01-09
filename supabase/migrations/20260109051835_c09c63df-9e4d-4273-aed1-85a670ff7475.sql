-- Ensure helper exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1) Ensure bucket exists + is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id)
DO UPDATE SET name = EXCLUDED.name, public = EXCLUDED.public;

-- 2) Storage policies (idempotent)
DROP POLICY IF EXISTS "Public can view organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete organization assets" ON storage.objects;

CREATE POLICY "Public can view organization assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organization-assets');

CREATE POLICY "Org members can upload organization assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-assets'
  AND public.has_org_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Org members can update organization assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND public.has_org_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'organization-assets'
  AND public.has_org_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Org members can delete organization assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND public.has_org_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 3) coupons updated_at trigger (idempotent)
DROP TRIGGER IF EXISTS handle_coupons_updated_at ON public.coupons;
CREATE TRIGGER handle_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();