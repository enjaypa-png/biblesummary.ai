import Stripe from "stripe";

// Lazy-initialized Stripe client (avoids errors during build when env vars are missing)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// ============================================================================
// Product & Price Configuration
// ============================================================================
// These price IDs must match what you create in your Stripe dashboard.
// Set them in .env.local after creating the products in Stripe.
// ============================================================================

export const PRODUCTS = {
  // Per-book summary - one-time $0.99
  SUMMARY_SINGLE: {
    priceId: process.env.STRIPE_SUMMARY_SINGLE_PRICE_ID || "",
    mode: "payment" as const,
    amount: 99,
    label: "$0.99",
  },
  // Annual summary pass - $14.99/year
  SUMMARY_ANNUAL: {
    priceId: process.env.STRIPE_SUMMARY_ANNUAL_PRICE_ID || "",
    mode: "subscription" as const,
    amount: 1499,
    label: "$14.99/year",
  },
  // Verse Explain - $4.99/month
  EXPLAIN_MONTHLY: {
    priceId: process.env.STRIPE_EXPLAIN_MONTHLY_PRICE_ID || "",
    mode: "subscription" as const,
    amount: 499,
    label: "$4.99/month",
  },
  // Premium - $9.99/month
  PREMIUM_MONTHLY: {
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || "",
    mode: "subscription" as const,
    amount: 999,
    label: "$9.99/month",
  },
  // Premium - $79/year (all features)
  PREMIUM_ANNUAL: {
    priceId: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID || "",
    mode: "subscription" as const,
    amount: 7900,
    label: "$79/year",
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;
