# Stripe Integration Setup Guide

## Overview
Stripe payment integration has been implemented for subscription management. This allows photographers to subscribe to Pro or Enterprise plans.

## What's Been Implemented

### 1. Database Schema
- **Migration**: `supabase/migrations/20250115000000_add_stripe_subscriptions.sql`
- Tables created:
  - `subscriptions` - Stores user subscription data
  - `payment_methods` - Stores payment method information
  - `invoices` - Stores invoice history

### 2. Frontend Integration
- **Stripe Client**: `src/integrations/stripe/client.ts`
  - Stripe initialization
  - Subscription plans configuration
- **Stripe Library**: `src/lib/stripe.ts`
  - Functions for creating checkout sessions
  - Functions for managing subscriptions
- **Subscription UI**: `src/components/dashboard/SubscriptionTab.tsx`
  - Pricing plans display
  - Subscription management
  - Upgrade/downgrade functionality

### 3. Supabase Edge Functions
- **create-checkout-session**: Creates Stripe checkout sessions
- **create-portal-session**: Opens Stripe customer portal for billing management
- **stripe-webhook**: Handles Stripe webhook events (subscription updates, payments, etc.)

## Environment Variables Required

Add these to your `.env` file or Supabase project settings:

```env
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price IDs (create products in Stripe dashboard)
VITE_STRIPE_PRO_PRICE_ID=price_...
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_...

# Stripe Webhook Secret (get from Stripe webhook settings)
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (should already be set)
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## Setup Steps

### 1. Create Stripe Products
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create two products:
   - **Pro Plan**: $29/month (recurring)
   - **Enterprise Plan**: $99/month (recurring)
3. Copy the Price IDs and add them to your environment variables

### 2. Configure Webhook
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Run Database Migration
```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually through Supabase dashboard
```

### 4. Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

## Usage

### For Users
1. Navigate to Dashboard → Subscription tab
2. Choose a plan (Pro or Enterprise)
3. Complete checkout via Stripe
4. Manage billing through "Manage Billing" button

### For Developers
- Check subscription status: `getSubscription()`
- Create checkout: `createCheckoutSession({ priceId, successUrl, cancelUrl })`
- Open portal: `createPortalSession(returnUrl)`

## Subscription Plans

- **Free**: Basic features, 3 events/month
- **Pro**: $29/month - Unlimited events, advanced features
- **Enterprise**: $99/month - Everything + dedicated support

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Any expiry date and CVC will work in test mode.

