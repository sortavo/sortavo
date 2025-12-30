// SORTAVO Stripe Configuration - TEST MODE
// These are Stripe TEST product and price IDs

export const STRIPE_PLANS = {
  basic: {
    name: "Basic",
    monthlyPrice: 49,
    annualPrice: 490,
    monthlyPriceId: "price_1SjvNEDPAURVR9VYo48CuIdo",
    annualPriceId: "price_1SjvNKDPAURVR9VYTaWlJiqR",
    productId: "prod_ThK1EiE0AtKCIM",
    features: [
      "2 sorteos activos",
      "2,000 boletos por sorteo",
      "1 plantilla",
      "Soporte por email (48h)",
    ],
    limits: {
      maxActiveRaffles: 2,
      maxTicketsPerRaffle: 2000,
      templatesAvailable: 1,
    },
  },
  pro: {
    name: "Pro",
    monthlyPrice: 149,
    annualPrice: 1490,
    monthlyPriceId: "price_1SjvNMDPAURVR9VYkqjmzN1v",
    annualPriceId: "price_1SjvNNDPAURVR9VY3sqCZ87h",
    productId: "prod_ThK1LTy6UcPdrl",
    popular: true,
    features: [
      "7 sorteos activos",
      "30,000 boletos por sorteo",
      "6 plantillas",
      "Lotería Nacional",
      "Sin marca Sortavo",
      "Soporte WhatsApp (12h)",
    ],
    limits: {
      maxActiveRaffles: 7,
      maxTicketsPerRaffle: 30000,
      templatesAvailable: 6,
    },
  },
  premium: {
    name: "Premium",
    monthlyPrice: 299,
    annualPrice: 2990,
    monthlyPriceId: "price_1SjvNPDPAURVR9VYUkxIxLaW",
    annualPriceId: "price_1SjvNRDPAURVR9VYhvvFqB0k",
    productId: "prod_ThK1L4ZhLIMS0C",
    features: [
      "15 sorteos activos",
      "100,000 boletos por sorteo",
      "6 plantillas + CSS personalizado",
      "Bot de Telegram incluido",
      "Account Manager dedicado",
      "Setup asistido incluido",
    ],
    limits: {
      maxActiveRaffles: 15,
      maxTicketsPerRaffle: 100000,
      templatesAvailable: 6,
    },
  },
  enterprise: {
    name: "Enterprise",
    monthlyPrice: 499,
    annualPrice: 4990,
    monthlyPriceId: "price_1SjvNTDPAURVR9VYEoMGZChr",
    annualPriceId: "price_1SjvNUDPAURVR9VYBwTQUNtp",
    productId: "prod_ThK18K9yms0nxs",
    features: [
      "Sorteos ilimitados",
      "10,000,000 boletos por sorteo",
      "Bot de Telegram incluido",
      "API Access",
      "Account Manager dedicado",
      "SLA 99.9% uptime",
      "Soporte 24/7 telefónico",
    ],
    limits: {
      maxActiveRaffles: 999,
      maxTicketsPerRaffle: 10000000,
      templatesAvailable: 6,
    },
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;
export type BillingPeriod = "monthly" | "annual";

export function getPriceId(plan: PlanKey, period: BillingPeriod): string {
  return period === "annual"
    ? STRIPE_PLANS[plan].annualPriceId
    : STRIPE_PLANS[plan].monthlyPriceId;
}

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.productId === productId) {
      return key as PlanKey;
    }
  }
  return null;
}
