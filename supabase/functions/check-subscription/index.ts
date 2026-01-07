import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product IDs to plan mapping
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_TkIOVxLtHFOGw6": "impulso",
  "prod_TkIPM3yibfAj7n": "crescimento",
  "prod_TkIPEnTREeAReq": "dominio",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free plan");
      
      // Update subscription to free plan
      await supabaseClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan: "explorador",
          status: "active",
          stripe_customer_id: null,
          stripe_subscription_id: null,
          current_period_end: null,
        }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "explorador",
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let plan = "explorador";
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      const productId = subscription.items.data[0].price.product as string;
      plan = PRODUCT_TO_PLAN[productId] || "explorador";
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        plan,
        endDate: subscriptionEnd 
      });
    } else {
      logStep("No active subscription found");
    }

    // Update subscription in database
    await supabaseClient
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        plan: plan,
        status: hasActiveSub ? "active" : "inactive",
        stripe_customer_id: customerId,
        stripe_subscription_id: stripeSubscriptionId,
        current_period_end: subscriptionEnd,
      }, { onConflict: "user_id" });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan: plan,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
