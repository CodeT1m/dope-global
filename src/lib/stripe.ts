import { supabase } from "@/integrations/supabase/client";

export interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  priceId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        priceId,
        successUrl,
        cancelUrl,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create checkout session");
  }

  return response.json();
}

export async function createPortalSession(returnUrl: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ returnUrl }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create portal session");
  }

  return response.json();
}

export async function getSubscription() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No subscription found
      return null;
    }
    throw error;
  }

  return data;
}

