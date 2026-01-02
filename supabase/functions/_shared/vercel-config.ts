// Centralized Vercel configuration for all Edge Functions

export const VERCEL_IPS = [
  '76.76.21.21',
  '76.76.21.164', 
  '76.76.21.241'
];

export const VERCEL_CNAMES = [
  'cname.vercel-dns.com'
];

// Domains that cannot be added as custom domains
export const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'sortavo.com',
  'sortavo.app',
  'lovable.app',
  'lovable.dev',
  'vercel.app',
  'vercel.com',
  'supabase.co',
  'supabase.com'
];

// Reserved subdomains that trigger a warning (but don't block)
export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'app',
  'admin',
  'auth',
  'mail',
  'email',
  'smtp',
  'ftp',
  'cdn',
  'static',
  'assets',
  'media',
  'dashboard'
];

// Domain validation regex (RFC 1035 compliant)
export const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
export const MAX_DOMAIN_LENGTH = 253;

export interface DomainValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  normalizedDomain?: string;
}

export function validateDomain(domain: string): DomainValidationResult {
  if (!domain || typeof domain !== 'string') {
    return { valid: false, error: 'Domain is required and must be a string' };
  }
  
  const normalized = domain.toLowerCase().trim();
  
  if (normalized.length === 0) {
    return { valid: false, error: 'Domain cannot be empty' };
  }
  
  if (normalized.length > MAX_DOMAIN_LENGTH) {
    return { valid: false, error: `Domain exceeds maximum length of ${MAX_DOMAIN_LENGTH} characters` };
  }
  
  if (!DOMAIN_REGEX.test(normalized)) {
    return { valid: false, error: 'Invalid domain format. Example: mydomain.com' };
  }
  
  // Block potential injection attempts
  if (normalized.includes('..') || normalized.includes('//') || normalized.includes('\\')) {
    return { valid: false, error: 'Invalid characters in domain' };
  }
  
  // Check blocked domains
  for (const blocked of BLOCKED_DOMAINS) {
    if (normalized === blocked || normalized.endsWith(`.${blocked}`)) {
      return { valid: false, error: `Domain ${blocked} is not allowed` };
    }
  }
  
  // Check for reserved subdomains (warning only)
  const parts = normalized.split('.');
  let warning: string | undefined;
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      warning = `Subdomain "${subdomain}" is commonly reserved. Make sure this is intentional.`;
    }
  }
  
  return { valid: true, normalizedDomain: normalized, warning };
}

// Subscription tier limits for custom domains
export const DOMAIN_LIMITS: Record<string, number> = {
  basic: 0,
  pro: 3,
  premium: 10,
  enterprise: 100
};

export function getDomainLimit(tier: string | null): number {
  const normalizedTier = (tier || 'basic').toLowerCase();
  return DOMAIN_LIMITS[normalizedTier] ?? 0;
}

export function canHaveCustomDomains(tier: string | null): boolean {
  return getDomainLimit(tier) > 0;
}
