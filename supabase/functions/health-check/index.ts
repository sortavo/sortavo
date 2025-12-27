import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceHealth {
  name: string;
  status: "operational" | "degraded" | "outage";
  responseTime: number;
  message?: string;
  lastChecked: string;
}

const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = Math.round(performance.now() - start);
  return { result, duration };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const services: ServiceHealth[] = [];
  const now = new Date().toISOString();

  // 1. Check Database
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { duration } = await measureTime(async () => {
      const { error } = await supabase.from("organizations").select("id").limit(1);
      if (error) throw error;
      return true;
    });

    services.push({
      name: "Base de Datos",
      status: duration < 500 ? "operational" : duration < 2000 ? "degraded" : "outage",
      responseTime: duration,
      lastChecked: now,
    });
  } catch (error) {
    console.error("[HEALTH-CHECK] Database error:", error);
    services.push({
      name: "Base de Datos",
      status: "outage",
      responseTime: 0,
      message: error instanceof Error ? error.message : "Error de conexión",
      lastChecked: now,
    });
  }

  // 2. Check Stripe API
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      services.push({
        name: "Pagos (Stripe)",
        status: "outage",
        responseTime: 0,
        message: "API key no configurada",
        lastChecked: now,
      });
    } else {
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      
      const { duration } = await measureTime(async () => {
        await stripe.balance.retrieve();
        return true;
      });

      services.push({
        name: "Pagos (Stripe)",
        status: duration < 1000 ? "operational" : duration < 3000 ? "degraded" : "outage",
        responseTime: duration,
        lastChecked: now,
      });
    }
  } catch (error) {
    console.error("[HEALTH-CHECK] Stripe error:", error);
    services.push({
      name: "Pagos (Stripe)",
      status: "outage",
      responseTime: 0,
      message: error instanceof Error ? error.message : "Error de conexión",
      lastChecked: now,
    });
  }

  // 3. Check Edge Functions (self-check)
  try {
    const { duration } = await measureTime(async () => {
      // Simple self-check - if we got here, edge functions are working
      return true;
    });

    services.push({
      name: "API / Edge Functions",
      status: "operational",
      responseTime: duration,
      lastChecked: now,
    });
  } catch (error) {
    console.error("[HEALTH-CHECK] Edge functions error:", error);
    services.push({
      name: "API / Edge Functions",
      status: "outage",
      responseTime: 0,
      message: error instanceof Error ? error.message : "Error",
      lastChecked: now,
    });
  }

  // 4. Check Auth Service
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { duration } = await measureTime(async () => {
      // Check if auth service responds
      const { error } = await supabase.auth.getSession();
      // No error means auth is responding (session might be null, that's ok)
      if (error && !error.message.includes("session")) throw error;
      return true;
    });

    services.push({
      name: "Autenticación",
      status: duration < 500 ? "operational" : duration < 2000 ? "degraded" : "outage",
      responseTime: duration,
      lastChecked: now,
    });
  } catch (error) {
    console.error("[HEALTH-CHECK] Auth error:", error);
    services.push({
      name: "Autenticación",
      status: "outage",
      responseTime: 0,
      message: error instanceof Error ? error.message : "Error de conexión",
      lastChecked: now,
    });
  }

  // 5. Check Email Service (Resend) - ping test
  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      services.push({
        name: "Email",
        status: "degraded",
        responseTime: 0,
        message: "API key no configurada",
        lastChecked: now,
      });
    } else {
      const { duration } = await measureTime(async () => {
        const response = await fetch("https://api.resend.com/domains", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok && response.status !== 401) {
          throw new Error(`HTTP ${response.status}`);
        }
        return true;
      });

      services.push({
        name: "Email",
        status: duration < 1000 ? "operational" : duration < 3000 ? "degraded" : "outage",
        responseTime: duration,
        lastChecked: now,
      });
    }
  } catch (error) {
    console.error("[HEALTH-CHECK] Email error:", error);
    services.push({
      name: "Email",
      status: "outage",
      responseTime: 0,
      message: error instanceof Error ? error.message : "Error de conexión",
      lastChecked: now,
    });
  }

  // 6. Check Storage
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { duration } = await measureTime(async () => {
      const { error } = await supabase.storage.listBuckets();
      if (error) throw error;
      return true;
    });

    services.push({
      name: "Almacenamiento",
      status: duration < 500 ? "operational" : duration < 2000 ? "degraded" : "outage",
      responseTime: duration,
      lastChecked: now,
    });
  } catch (error) {
    console.error("[HEALTH-CHECK] Storage error:", error);
    services.push({
      name: "Almacenamiento",
      status: "outage",
      responseTime: 0,
      message: error instanceof Error ? error.message : "Error de conexión",
      lastChecked: now,
    });
  }

  // Calculate overall status
  const hasOutage = services.some(s => s.status === "outage");
  const hasDegraded = services.some(s => s.status === "degraded");
  const overallStatus = hasOutage ? "outage" : hasDegraded ? "degraded" : "operational";

  return new Response(JSON.stringify({
    status: overallStatus,
    services,
    checkedAt: now,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
