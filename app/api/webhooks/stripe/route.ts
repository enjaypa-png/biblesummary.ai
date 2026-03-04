import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

/**
 * Map product_type from checkout metadata to the DB subscription type.
 * The DB CHECK constraint only allows: 'summary_annual', 'explain_monthly', 'premium_yearly'.
 * Both premium_annual and premium_monthly grant the same all-access tier.
 */
function toDbSubscriptionType(productType: string): string {
  switch (productType) {
    case "premium_annual":
    case "premium_monthly":
      return "premium_yearly";
    default:
      return productType;
  }
}

const VALID_SUBSCRIPTION_TYPES = ["summary_annual", "explain_monthly", "premium_yearly"];

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
  const stripe = getStripe();

  try {
    switch (event.type) {
      // ─── Checkout completed — handles BOTH one-time and subscription purchases ───
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const productType = metadata.product_type;
        const userId = metadata.user_id;

        if (!userId || !productType) {
          console.error("Missing user_id or product_type in session metadata");
          break;
        }

        // One-time payment (summary_single)
        if (productType === "summary_single" && session.payment_status === "paid") {
          const bookId = metadata.book_id;
          if (!bookId) {
            console.error("Missing book_id for summary_single purchase");
            break;
          }

          const { error: upsertError } = await supabase.from("purchases").upsert(
            {
              user_id: userId,
              book_id: bookId,
              type: "single",
              stripe_payment_id: session.payment_intent as string,
              amount_cents: 99,
            },
            { onConflict: "user_id,book_id" }
          );

          if (upsertError) {
            console.error("Failed to upsert purchase:", upsertError);
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }
        }

        // Subscription purchase
        const dbType = toDbSubscriptionType(productType);
        if (VALID_SUBSCRIPTION_TYPES.includes(dbType) && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          // Fetch the full subscription from Stripe to get accurate period data
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          const firstItem = subscription.items?.data?.[0];
          const periodStartTs = firstItem?.current_period_start ?? Math.floor(Date.now() / 1000);
          const periodEndTs = firstItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 30;
          const periodStart = new Date(periodStartTs * 1000).toISOString();
          const periodEnd = new Date(periodEndTs * 1000).toISOString();

          const { error: upsertError } = await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              type: dbType,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,
              status: subscription.status === "active" ? "active" : subscription.status,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,type" }
          );

          if (upsertError) {
            console.error("Failed to upsert subscription:", upsertError);
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }
        }

        break;
      }

      // ─── Subscription renewed / status changed ───
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = subscription.metadata || {};

        const productType = metadata.product_type;
        const userId = metadata.user_id;

        // If metadata is missing, try to find the subscription in our DB by stripe_subscription_id
        if (!userId || !productType) {
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id, type")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (!existing) {
            console.error("Missing metadata and no DB record for subscription:", subscription.id);
            break;
          }

          // Update status using the DB record we found
          let status: string;
          switch (subscription.status) {
            case "active": status = "active"; break;
            case "past_due": status = "past_due"; break;
            case "canceled": status = "canceled"; break;
            case "trialing": status = "trialing"; break;
            default: status = "expired";
          }

          const subItem = subscription.items?.data?.[0];
          const pStartTs = subItem?.current_period_start ?? Math.floor(Date.now() / 1000);
          const pEndTs = subItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 30;
          const periodStart = new Date(pStartTs * 1000).toISOString();
          const periodEnd = new Date(pEndTs * 1000).toISOString();

          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          if (updateError) {
            console.error("Failed to update subscription:", updateError);
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }

          break;
        }

        const dbType = toDbSubscriptionType(productType);
        if (!VALID_SUBSCRIPTION_TYPES.includes(dbType)) {
          break;
        }

        let status: string;
        switch (subscription.status) {
          case "active": status = "active"; break;
          case "past_due": status = "past_due"; break;
          case "canceled": status = "canceled"; break;
          case "trialing": status = "trialing"; break;
          default: status = "expired";
        }

        const subItem2 = subscription.items?.data?.[0];
        const pStartTs2 = subItem2?.current_period_start ?? Math.floor(Date.now() / 1000);
        const pEndTs2 = subItem2?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 30;
        const periodStart = new Date(pStartTs2 * 1000).toISOString();
        const periodEnd = new Date(pEndTs2 * 1000).toISOString();

        const { error: upsertError } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            type: dbType,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer.id,
            status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,type" }
        );

        if (upsertError) {
          console.error("Failed to upsert subscription update:", upsertError);
          return NextResponse.json({ error: "Database write failed" }, { status: 500 });
        }
        break;
      }

      // ─── Subscription renewed (invoice paid) ───
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSub = invoice.parent?.subscription_details?.subscription;
        if (invoice.billing_reason === "subscription_cycle" && invoiceSub) {
          const subscriptionId = typeof invoiceSub === "string" ? invoiceSub : invoiceSub.id;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          const subItem = subscription.items?.data?.[0];
          const pStartTs = subItem?.current_period_start ?? Math.floor(Date.now() / 1000);
          const pEndTs = subItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 30;
          const periodStart = new Date(pStartTs * 1000).toISOString();
          const periodEnd = new Date(pEndTs * 1000).toISOString();

          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
        break;
      }

      // ─── Renewal payment failed ───
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSub = invoice.parent?.subscription_details?.subscription;
        if (invoiceSub) {
          const subscriptionId = typeof invoiceSub === "string" ? invoiceSub : invoiceSub.id;

          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
        break;
      }

      // ─── Subscription canceled or expired ───
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

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
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
