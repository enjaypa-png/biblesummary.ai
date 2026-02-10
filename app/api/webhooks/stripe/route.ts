import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase not configured for webhook processing");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      // ─── One-time payment completed (summary_single) ───
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        if (metadata.product_type === "summary_single" && session.payment_status === "paid") {
          const userId = metadata.user_id;
          const bookId = metadata.book_id;

          if (!userId || !bookId) {
            console.error("Missing user_id or book_id in session metadata");
            break;
          }

          // Record the one-time purchase
          await supabase.from("purchases").upsert(
            {
              user_id: userId,
              book_id: bookId,
              type: "single",
              stripe_payment_id: session.payment_intent as string,
              amount_cents: 99,
            },
            { onConflict: "user_id,book_id" }
          );
        }
        break;
      }

      // ─── Subscription created or renewed ───
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = subscription.metadata || {};

        const productType = metadata.product_type;
        const userId = metadata.user_id;

        if (!userId || !productType) {
          console.error("Missing metadata on subscription:", subscription.id);
          break;
        }

        if (productType !== "summary_annual" && productType !== "explain_monthly") {
          console.error("Unknown product_type in subscription metadata:", productType);
          break;
        }

        // Map Stripe status to our status
        let status: string;
        switch (subscription.status) {
          case "active":
            status = "active";
            break;
          case "past_due":
            status = "past_due";
            break;
          case "canceled":
            status = "canceled";
            break;
          case "trialing":
            status = "trialing";
            break;
          default:
            status = "expired";
        }

        // Get period from subscription items (Stripe API 2026+)
        const firstItem = subscription.items?.data?.[0];
        const periodStartTs = firstItem?.current_period_start ?? Math.floor(Date.now() / 1000);
        const periodEndTs = firstItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 365;
        const periodStart = new Date(periodStartTs * 1000).toISOString();
        const periodEnd = new Date(periodEndTs * 1000).toISOString();

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            type: productType,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,type" }
        );
        break;
      }

      // ─── Subscription canceled or expired ───
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Mark subscription as expired
        await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      default:
        // Unhandled event type - that's fine
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
