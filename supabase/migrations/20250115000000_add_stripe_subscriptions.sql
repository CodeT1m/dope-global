-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create payment methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'card', 'bank_account', etc.
  card_brand TEXT,
  card_last4 TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_paid BIGINT NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- 'paid', 'open', 'void', 'uncollectible'
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for payment_methods
CREATE POLICY "Users can view their own payment methods"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own payment methods"
  ON public.payment_methods FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_stripe_invoice_id ON public.invoices(stripe_invoice_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

