import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/verify-purchase
 *
 * Called client-side after the user returns from Stripe Checkout.
 * Verifies the checkout session with Stripe and records the purchase/subscription
 * in the database. This is a fallback for when the webhook doesn't fire
 * (e.g. webhook not configured, secret mismatch, network issues).
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 500 });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    // Authenticate the user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const accessToken = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Retrieve the checkout session from Stripe
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Verify this session belongs to this user
    const metadata = session.metadata || {};
    if (metadata.user_id !== user.id) {
      return NextResponse.json({ error: "Session does not belong to this user" }, { status: 403 });
    }

    const productType = metadata.product_type;

    if (!productType) {
      return NextResponse.json({ error: "Unknown product type" }, { status: 400 });
    }

    // Handle one-time purchase (summary_single)
    if (productType === "summary_single") {
      const bookId = metadata.book_id;
      if (!bookId) {
        return NextResponse.json({ error: "Missing book ID" }, { status: 400 });
      }

      await supabase.from("purchases").upsert(
        {
          user_id: user.id,
          book_id: bookId,
          type: "single",
          stripe_payment_id: typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || sessionId,
          amount_cents: 99,
        },
        { onConflict: "user_id,book_id" }
      );

      return NextResponse.json({ verified: true, product: "summary_single", bookId });
    }

    // Handle subscription purchase (summary_annual or explain_monthly)
    if (
      (productType === "summary_annual" || productType === "explain_monthly") &&
      session.subscription
    ) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const firstItem = subscription.items?.data?.[0];
      const periodStartTs = firstItem?.current_period_start ?? Math.floor(Date.now() / 1000);
      const periodEndTs = firstItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 30;
      const periodStart = new Date(periodStartTs * 1000).toISOString();
      const periodEnd = new Date(periodEndTs * 1000).toISOString();

      await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          type: productType,
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

      return NextResponse.json({ verified: true, product: productType });
    }

    return NextResponse.json({ error: "Could not verify purchase" }, { status: 400 });
  } catch (error) {
    console.error("Verify purchase error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
