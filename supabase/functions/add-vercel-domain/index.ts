import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts"
import { validateDomain, getDomainLimit, canHaveCustomDomains } from "../_shared/vercel-config.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting: 5 domain additions per minute per IP
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(clientIP, { 
      ...RATE_LIMITS.STRICT, 
      maxRequests: 5,
      keyPrefix: 'add-domain' 
    });
    
    if (!rateLimitResult.allowed) {
      console.warn(`[add-vercel-domain] Rate limit exceeded for IP: ${clientIP}`);
      return rateLimitResponse(rateLimitResult, corsHeaders);
    }

    // ==========================================
    // AUTHENTICATION: Verify JWT and get user
    // ==========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's JWT to get their identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('[add-vercel-domain] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ==========================================
    // AUTHORIZATION: Verify user is org admin
    // ==========================================
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error('[add-vercel-domain] Profile error:', profileError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'User organization not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const organizationId = profile.organization_id;

    // Verify user is admin of this organization
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (roleError || !userRole || !['owner', 'admin'].includes(userRole.role)) {
      console.error('[add-vercel-domain] Role check failed:', roleError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // SUBSCRIPTION TIER VALIDATION
    // ==========================================
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      console.error('[add-vercel-domain] Org error:', orgError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tier = organization.subscription_tier || 'basic';
    if (!canHaveCustomDomains(tier)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Custom domains require Pro plan or higher' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // DOMAIN LIMIT VALIDATION
    // ==========================================
    const domainLimit = getDomainLimit(tier);
    const { count: currentDomainCount, error: countError } = await supabase
      .from('custom_domains')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (countError) {
      console.error('[add-vercel-domain] Count error:', countError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check domain limit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((currentDomainCount || 0) >= domainLimit) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Domain limit reached. Your ${tier} plan allows ${domainLimit} custom domains.` 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // DOMAIN VALIDATION
    // ==========================================
    const { domain } = await req.json();
    const validation = validateDomain(domain);
    
    if (!validation.valid) {
      console.error('[add-vercel-domain] Domain validation failed:', validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedDomain = validation.normalizedDomain!;
    console.log(`[add-vercel-domain] Adding domain: ${normalizedDomain} for org: ${organizationId}, tier: ${tier}`);

    // ==========================================
    // VERCEL API CALL
    // ==========================================
    const VERCEL_API_TOKEN = Deno.env.get('VERCEL_API_TOKEN');
    const VERCEL_PROJECT_ID = Deno.env.get('VERCEL_PROJECT_ID');
    const VERCEL_TEAM_ID = Deno.env.get('VERCEL_TEAM_ID');

    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      console.error('[add-vercel-domain] Missing Vercel credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(
        `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains${teamQuery}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: normalizedDomain }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        console.error('[add-vercel-domain] Vercel API error:', data);
        
        // Handle specific Vercel errors
        if (response.status === 409) {
          return new Response(
            JSON.stringify({ success: false, error: 'Domain already exists in Vercel' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const errorMessage = data.error?.message || 'Failed to add domain to Vercel';
        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[add-vercel-domain] Successfully added domain: ${normalizedDomain}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          vercelDomain: data,
          warning: validation.warning 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError: unknown) {
      clearTimeout(timeout);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[add-vercel-domain] Vercel API timeout');
        return new Response(
          JSON.stringify({ success: false, error: 'Vercel API timeout. Please try again.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[add-vercel-domain] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
