import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripe, PRODUCTS } from "@/lib/stripe";

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
    const { product, bookId, bookSlug, returnPath } = await req.json();

    // ── Authenticate user from the Authorization header ──
    // The client sends the Supabase access token as "Bearer <token>".
    // We verify it server-side with the service-role client.
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

    const userId = user.id;
    const userEmail = user.email || null;

    // Determine the product configuration
    let productConfig;
    let mode: "payment" | "subscription";
    const metadata: Record<string, string> = { user_id: userId };

    switch (product) {
      case "summary_single":
        if (!bookId) {
          return NextResponse.json({ error: "Book ID required for single purchase" }, { status: 400 });
        }

        // ── Prevent duplicate purchases ──
        const { data: existingPurchase } = await supabase
          .from("purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("book_id", bookId)
          .eq("type", "single")
          .single();

        if (existingPurchase) {
          return NextResponse.json(
            { error: "You already own this summary." },
            { status: 400 }
          );
        }

        productConfig = PRODUCTS.SUMMARY_SINGLE;
        mode = "payment";
        metadata.product_type = "summary_single";
        metadata.book_id = bookId;
        if (bookSlug) metadata.book_slug = bookSlug;
        break;

      case "summary_annual":
        productConfig = PRODUCTS.SUMMARY_ANNUAL;
        mode = "subscription";
        metadata.product_type = "summary_annual";
        break;

      case "explain_monthly":
        productConfig = PRODUCTS.EXPLAIN_MONTHLY;
        mode = "subscription";
        metadata.product_type = "explain_monthly";
        break;

      default:
        return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    if (!productConfig.priceId) {
      return NextResponse.json({ error: "Product not configured in Stripe" }, { status: 500 });
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | null = null;

    const { data: existingCustomer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await getStripe().customers.create({
        email: userEmail || undefined,
        metadata: { supabase_user_id: userId },
      });
      stripeCustomerId = customer.id;

      await supabase.from("stripe_customers").insert({
        user_id: userId,
        stripe_customer_id: customer.id,
      });
    }

    // Build success/cancel URLs
    // {CHECKOUT_SESSION_ID} is a Stripe template variable — Stripe replaces it with the real session ID
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const successUrl = `${origin}${returnPath || "/summaries"}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}${returnPath || "/summaries"}?checkout=canceled`;

    // Create checkout session
    const sessionParams: Record<string, unknown> = {
      customer: stripeCustomerId,
      line_items: [{ price: productConfig.priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    };

    if (mode === "subscription") {
      (sessionParams as Record<string, unknown>).subscription_data = { metadata };
    }

    const session = await getStripe().checkout.sessions.create(
      sessionParams as Stripe.Checkout.SessionCreateParams
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
