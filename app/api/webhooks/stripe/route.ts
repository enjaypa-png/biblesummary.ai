import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripe, PRODUCTS } from "@/lib/stripe";

// ─── Supabase admin client (service role, bypasses RLS) ───
let _supabaseAdmin: any = null; // eslint-disable-line
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return _supabaseAdmin;
}

/**
 * Determine subscription type from a Stripe price ID.
 * Compares against env-configured price IDs from PRODUCTS.
 */
function subscriptionTypeFromPriceId(priceId: string): string {
  if (priceId === PRODUCTS.PREMIUM_ANNUAL.priceId) return "premium_yearly";
  if (priceId === PRODUCTS.PREMIUM_MONTHLY.priceId) return "premium_yearly";
  if (priceId === PRODUCTS.EXPLAIN_MONTHLY.priceId) return "explain_monthly";
  if (priceId === PRODUCTS.SUMMARY_ANNUAL.priceId) return "summary_annual";
  // Fallback: treat unknown subscription prices as premium_yearly
  return "premium_yearly";
}

/**
 * Map Stripe subscription status to valid DB CHECK constraint values.
 * DB allows: 'active', 'canceled', 'past_due', 'expired', 'trialing'
 */
function toDbStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active": return "active";
    case "past_due": return "past_due";
    case "canceled": return "canceled";
    case "trialing": return "trialing";
    default:
      return "expired";
  }
}

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

  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  try {
    switch (event.type) {
      // ─── Checkout completed — handles BOTH one-time and subscription purchases ───
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        // 1. Get Stripe IDs directly from session
        const stripeCustomerId = typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;
        const stripeSubscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

        // 2. Find user in auth.users by email
        const customerEmail = session.customer_details?.email;
        let userId = metadata.user_id;

        if (customerEmail) {
          const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
          const matchedUser = authList?.users?.find(
            (u: { email?: string }) => u.email === customerEmail
          );
          if (matchedUser) {
            userId = matchedUser.id;
          }
        }

        if (!userId) {
          console.error("Cannot resolve user for checkout session", {
            email: customerEmail,
            metadata,
          });
          return NextResponse.json({ error: "User not found" }, { status: 500 });
        }

        // 3. Get price_id from checkout session line items
        const expandedSession = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ["line_items"] }
        );
        const priceId = expandedSession.line_items?.data?.[0]?.price?.id ?? null;

        // One-time payment (summary_single)
        if (metadata.product_type === "summary_single" && session.payment_status === "paid") {
          const bookId = metadata.book_id;
          if (!bookId) {
            console.error("Missing book_id for summary_single purchase");
            break;
          }

          const { error: upsertError } = await supabaseAdmin.from("purchases").upsert(
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

        // 4. Subscription purchase — upsert into public.subscriptions
        if (stripeSubscriptionId) {
          // Determine subscription type from price_id
          const dbType = priceId
            ? subscriptionTypeFromPriceId(priceId)
            : "premium_yearly";

          // Fetch full subscription from Stripe for period data
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

          const firstItem = subscription.items?.data?.[0];
          const periodStartTs = firstItem?.current_period_start ?? Math.floor(Date.now() / 1000);
          const periodEndTs = firstItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 30;
          const periodStart = new Date(periodStartTs * 1000).toISOString();
          const periodEnd = new Date(periodEndTs * 1000).toISOString();

          // 5. Upsert with conflict on stripe_subscription_id
          const { error: upsertError } = await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: stripeCustomerId
                ?? (typeof subscription.customer === "string"
                  ? subscription.customer
                  : subscription.customer.id),
              stripe_subscription_id: stripeSubscriptionId,
              price_id: priceId,
              status: "active",
              type: dbType,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" }
          );

          if (upsertError) {
            console.error("Failed to upsert subscription:", upsertError);
            return NextResponse.json({ error: "Database write failed" }, { status: 500 });
          }
        }

        // 6. Return HTTP 200
        break;
      }

      // ─── Subscription renewed / status changed ───
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const subItem = subscription.items?.data?.[0];
        const pStartTs = subItem?.current_period_start ?? Math.floor(Date.now() / 1000);
        const pEndTs = subItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 30;
        const periodStart = new Date(pStartTs * 1000).toISOString();
        const periodEnd = new Date(pEndTs * 1000).toISOString();

        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: toDbStatus(subscription.status),
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

      // ─── Subscription renewed (invoice paid) ───
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Stripe SDK v20+ nests subscription under parent.subscription_details
        const invoiceRaw = invoice as any; // eslint-disable-line
        const subscriptionId: string | null =
          (typeof invoiceRaw.subscription === "string" ? invoiceRaw.subscription : null)
          ?? (typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : invoice.parent?.subscription_details?.subscription?.id ?? null);

        if (subscriptionId) {
          const periodEndTs = invoice.lines?.data?.[0]?.period?.end;
          const periodEnd = periodEndTs
            ? new Date(periodEndTs * 1000).toISOString()
            : new Date(Date.now() + 86400 * 30 * 1000).toISOString();

          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
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
        const invoiceRaw = invoice as any; // eslint-disable-line
        const subscriptionId: string | null =
          (typeof invoiceRaw.subscription === "string" ? invoiceRaw.subscription : null)
          ?? (typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : invoice.parent?.subscription_details?.subscription?.id ?? null);

        if (subscriptionId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
        break;
      }

      // ─── Subscription canceled or deleted ───
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
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
