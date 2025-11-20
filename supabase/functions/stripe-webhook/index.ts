import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error("No user_id in session metadata");
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID in session");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  // Determine plan from price ID
  let plan = "pro";
  if (priceId === Deno.env.get("STRIPE_ENTERPRISE_PRICE_ID")) {
    plan = "enterprise";
  }

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan: plan as any,
    status: subscription.status as any,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!existing) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  let plan = "pro";
  if (priceId === Deno.env.get("STRIPE_ENTERPRISE_PRICE_ID")) {
    plan = "enterprise";
  }

  await supabase
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan: plan as any,
      status: subscription.status as any,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_customer_id", customerId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      stripe_subscription_id: null,
    })
    .eq("stripe_customer_id", customerId);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("user_id, id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!subscription) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  // Store invoice
  await supabase.from("invoices").upsert({
    user_id: subscription.user_id,
    stripe_invoice_id: invoice.id,
    subscription_id: subscription.id,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status || "paid",
    invoice_pdf: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
  });
}

