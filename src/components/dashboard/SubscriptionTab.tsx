import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getStripe, SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/integrations/stripe/client";
import { createCheckoutSession, createPortalSession, getSubscription } from "@/lib/stripe";
import { Check, Loader2, CreditCard, Zap } from "lucide-react";
import { format } from "date-fns";

const SubscriptionTab = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const sub = await getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === "free") {
      toast({
        title: "Already on Free Plan",
        description: "You're currently on the free plan.",
      });
      return;
    }

    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!planConfig.priceId) {
      toast({
        title: "Error",
        description: "Price ID not configured for this plan",
        variant: "destructive",
      });
      return;
    }

    setProcessing(plan);

    try {
      const { sessionId, url } = await createCheckoutSession({
        priceId: planConfig.priceId,
        successUrl: `${window.location.origin}/dashboard?subscription=success`,
        cancelUrl: `${window.location.origin}/dashboard?subscription=canceled`,
      });

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Stripe not initialized");
      }

      await stripe.redirectToCheckout({ sessionId });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleManageBilling = async () => {
    setProcessing("manage");
    try {
      const { url } = await createPortalSession(
        `${window.location.origin}/dashboard`
      );
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || "free";
  const isActive = subscription?.status === "active";

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {subscription && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">Current Plan</h3>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className="text-lg px-3 py-1"
              >
                {SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan].name}
              </Badge>
            </div>
            {isActive && (
              <Button
                onClick={handleManageBilling}
                disabled={processing === "manage"}
                variant="outline"
              >
                {processing === "manage" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
          {subscription.current_period_end && (
            <p className="text-sm text-muted-foreground">
              {subscription.cancel_at_period_end
                ? `Cancels on ${format(
                    new Date(subscription.current_period_end),
                    "MMMM d, yyyy"
                  )}`
                : `Renews on ${format(
                    new Date(subscription.current_period_end),
                    "MMMM d, yyyy"
                  )}`}
            </p>
          )}
        </Card>
      )}

      {/* Pricing Plans */}
      <div>
        <h2 className="text-3xl font-bold mb-6">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
            const planKey = key as SubscriptionPlan;
            const isCurrentPlan = currentPlan === planKey;
            const isUpgrade =
              (planKey === "pro" && currentPlan === "free") ||
              (planKey === "enterprise" &&
                (currentPlan === "free" || currentPlan === "pro"));

            return (
              <Card
                key={key}
                className={`p-6 relative ${
                  planKey === "pro" ? "border-primary border-2" : ""
                }`}
              >
                {planKey === "pro" && (
                  <Badge className="absolute top-4 right-4">Popular</Badge>
                )}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={
                    isCurrentPlan
                      ? "outline"
                      : planKey === "pro"
                      ? "default"
                      : "outline"
                  }
                  disabled={isCurrentPlan || processing !== null}
                  onClick={() => handleSubscribe(planKey)}
                >
                  {processing === planKey ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : isUpgrade ? (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade
                    </>
                  ) : (
                    "Select Plan"
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTab;

