import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY" },
      { status: 500 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase admin environment variables" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan || "founding_author";

      if (!userId) {
        console.error("Missing user_id in checkout session metadata");
        return NextResponse.json({ received: true });
      }

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id || null;

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id || null;

      let currentPeriodEnd: string | null = null;

if (subscriptionId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const periodEnd =
    (subscription as any).current_period_end ||
    (subscription as any).items?.data?.[0]?.current_period_end ||
    null;

  if (periodEnd) {
    currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
  }
}

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan,
          subscription_status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_period_end: currentPeriodEnd,
        })
        .eq("id", userId);

      if (error) {
        console.error("Supabase profile update error:", error);

        return NextResponse.json(
          { error: "Could not update profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}