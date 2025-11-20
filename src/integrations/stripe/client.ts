import { loadStripe, Stripe } from "@stripe/stripe-js";

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn("Stripe publishable key not found");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "Up to 3 events per month",
      "Basic photo upload",
      "AI face matching (limited)",
      "Community features",
    ],
  },
  pro: {
    name: "Pro",
    price: 29,
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    features: [
      "Unlimited events",
      "Unlimited photo uploads",
      "Advanced AI face matching",
      "Priority support",
      "Analytics dashboard",
      "Custom branding",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 99,
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "White-label options",
    ],
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

