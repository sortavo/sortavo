// Centralized Stripe Configuration for Edge Functions
// This file provides a single source of truth for all Stripe-related configurations

// Map Stripe product IDs to subscription tiers
// Includes both PRODUCTION and TEST mode product IDs
export const PRODUCT_TO_TIER: Record<string, "basic" | "pro" | "premium" | "enterprise"> = {
  // Production IDs - Monthly
  "prod_Tf5pTKxFYtPfd4": "basic",
  "prod_Tf5pa9W3qgWVFB": "basic", // Annual
  "prod_Tf5tsw8mmJQneA": "pro",
  "prod_Tf5tT8tG04qFOn": "pro", // Annual
  "prod_Tf5uiAAHV2WZNF": "premium",
  "prod_Tf5uRIGm04Ihh3": "premium", // Annual
  "prod_ThHMyhLAztHnsu": "enterprise",
  "prod_ThHMbFCP3wSrq8": "enterprise", // Annual
  // Test IDs
  "prod_ThK1EiE0AtKCIM": "basic",
  "prod_ThK1JlY6NKTIFS": "basic", // Annual
  "prod_ThK1LTy6UcPdrl": "pro",
  "prod_ThK1C9kzAMf4h9": "pro", // Annual
  "prod_ThK1L4ZhLIMS0C": "premium",
  "prod_ThK1pF8uFNd4yB": "premium", // Annual
  "prod_ThK18K9yms0nxs": "enterprise",
  "prod_ThK1X1RtiwN326": "enterprise", // Annual
};

// Subscription limits by tier - SINGLE SOURCE OF TRUTH
export const TIER_LIMITS = {
  basic: { 
    maxActiveRaffles: 2, 
    maxTicketsPerRaffle: 2000, 
    templatesAvailable: 3 
  },
  pro: { 
    maxActiveRaffles: 7, 
    maxTicketsPerRaffle: 30000, 
    templatesAvailable: 6 
  },
  premium: { 
    maxActiveRaffles: 15, 
    maxTicketsPerRaffle: 100000, 
    templatesAvailable: 9 
  },
  enterprise: { 
    maxActiveRaffles: 999, 
    maxTicketsPerRaffle: 10000000, 
    templatesAvailable: 9 
  },
} as const;

// All Basic plan price IDs (for trial detection)
export const BASIC_PRICE_IDS = [
  // Test mode
  "price_1SjvNEDPAURVR9VYo48CuIdo", // test monthly
  "price_1SjvNKDPAURVR9VYTaWlJiqR", // test annual
  // Live mode
  "price_1ShldQRk7xhLUSttlw5O8LPm", // live monthly
  "price_1ShldlRk7xhLUSttMCfocNpN", // live annual
];

// Helper function to get tier from product ID
export function getTierFromProductId(productId: string): "basic" | "pro" | "premium" | "enterprise" {
  return PRODUCT_TO_TIER[productId] || "basic";
}

// Helper function to get limits for a tier
export function getLimitsForTier(tier: "basic" | "pro" | "premium" | "enterprise") {
  return TIER_LIMITS[tier];
}

// Standardized API version for Stripe
export const STRIPE_API_VERSION = "2025-08-27.basil";
