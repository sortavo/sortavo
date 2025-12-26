-- Update the validation function to only block exact matches, not substrings
CREATE OR REPLACE FUNCTION public.validate_organization_slug()
RETURNS TRIGGER AS $$
DECLARE
  reserved_slugs TEXT[] := ARRAY[
    'auth', 'dashboard', 'onboarding', 'pricing', 'help', 'my-tickets', 'ticket', 'invite',
    'terms', 'privacy', 'r',
    'admin', 'api', 'login', 'logout', 'signup', 'register', 'settings', 'config',
    'app', 'www', 'mail', 'email', 'support', 'billing', 'account', 'org', 'organization',
    'user', 'users', 'static', 'assets', 'public', 'private', 'internal', 'system',
    'root', 'null', 'undefined', 'new', 'edit', 'delete', 'create', 'update',
    'cdn', 'media', 'images', 'files', 'uploads', 'downloads', 'docs', 'blog',
    'news', 'about', 'contact', 'faq', 'search', 'sitemap', 'robots', 'favicon',
    'sortavo'
  ];
  slug_lower TEXT;
BEGIN
  -- Skip validation if slug is null
  IF NEW.slug IS NULL THEN
    RETURN NEW;
  END IF;
  
  slug_lower := LOWER(NEW.slug);
  
  -- Check if slug exactly matches a reserved word
  IF slug_lower = ANY(reserved_slugs) THEN
    RAISE EXCEPTION 'Slug "%" is reserved and cannot be used', NEW.slug;
  END IF;
  
  -- Validate slug format (lowercase alphanumeric with hyphens)
  IF slug_lower !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid slug format. Use only lowercase letters, numbers, and hyphens';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;