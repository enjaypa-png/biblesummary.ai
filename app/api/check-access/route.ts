import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/check-access
 *
 * Checks if the authenticated user has access to summaries and/or explanations.
 *
 * 1. Fast path: check the subscriptions table in the database.
 * 2. If no DB record found, query Stripe directly for active subscriptions.
 * 3. If Stripe confirms an active subscription, write it to the database (self-heal)
 *    so future checks are instant.
 *
 * This ensures that even if the webhook and verify-purchase both failed,
 * the user still gets access as long as they actually paid.
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    // Authenticate user
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

    const body = await req.json().catch(() => ({}));
    const bookId = body.bookId || null;

    // ── Step 1: Check DB (fast path) ──
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("type, status, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "canceled"]);

    const now = new Date();
    const activeSubs = (subs || []).filter(
      (s) => new Date(s.current_period_end) > now
    );

    const activeTypes = new Set(activeSubs.map((s) => s.type));

    let hasSummaryAccess = activeTypes.has("premium_yearly") || activeTypes.has("summary_annual");
    let hasExplainAccess = activeTypes.has("premium_yearly") || activeTypes.has("explain_monthly");

    // Also check single-book purchases for summary access
    if (!hasSummaryAccess && bookId) {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .or(`book_id.eq.${bookId},type.eq.lifetime`)
        .limit(1);

      if (purchases && purchases.length > 0) {
        hasSummaryAccess = true;
      }
    }

    // If DB says yes, return immediately
    if (hasSummaryAccess && hasExplainAccess) {
      return NextResponse.json({ hasSummaryAccess, hasExplainAccess });
    }

    // ── Step 2: Check Stripe directly ──
    if (!process.env.STRIPE_SECRET_KEY) {
      // No Stripe key — return what we have from DB
      return NextResponse.json({ hasSummaryAccess, hasExplainAccess });
    }

    const stripe = getStripe();

    // Find the Stripe customer by email
    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ hasSummaryAccess, hasExplainAccess });
    }

    const customers = await stripe.customers.list({ email: userEmail, limit: 5 });

    if (customers.data.length === 0) {
      return NextResponse.json({ hasSummaryAccess, hasExplainAccess });
    }

    // Check all customers for active subscriptions
    for (const customer of customers.data) {
      const stripeSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 10,
      });

      for (const sub of stripeSubs.data) {
        // Determine the subscription type from metadata or price
        const metadata = sub.metadata || {};
        const productType = metadata.product_type || "";

        let dbType: string;
        switch (productType) {
          case "premium_annual":
          case "premium_monthly":
            dbType = "premium_yearly";
            break;
          case "explain_monthly":
            dbType = "explain_monthly";
            break;
          case "summary_annual":
            dbType = "summary_annual";
            break;
          default:
            // If no metadata, check the price amount to infer the type
            const amount = sub.items?.data?.[0]?.price?.unit_amount;
            if (amount === 7900 || amount === 999) {
              dbType = "premium_yearly";
            } else if (amount === 499) {
              dbType = "explain_monthly";
            } else if (amount === 1499) {
              dbType = "summary_annual";
            } else {
              // Default to premium for any active subscription we can't categorize
              dbType = "premium_yearly";
            }
        }

        // ── Step 3: Self-heal — write the missing record to DB ──
        const firstItem = sub.items?.data?.[0];
        const periodStart = new Date(
          (firstItem?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000
        ).toISOString();
        const periodEnd = new Date(
          (firstItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 365) * 1000
        ).toISOString();

        const { error: upsertError } = await supabase.from("subscriptions").upsert(
          {
            user_id: user.id,
            type: dbType,
            stripe_subscription_id: sub.id,
            stripe_customer_id: customer.id,
            status: "active",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,type" }
        );

        if (upsertError) {
          console.error(`[check-access] Failed to self-heal subscription for user ${user.id}:`, upsertError);
        } else {
          console.log(`[check-access] Self-healed: wrote ${dbType} subscription for user ${user.id} from Stripe sub ${sub.id}`);
        }

        // Update access flags
        if (dbType === "premium_yearly") {
          hasSummaryAccess = true;
          hasExplainAccess = true;
        } else if (dbType === "summary_annual") {
          hasSummaryAccess = true;
        } else if (dbType === "explain_monthly") {
          hasExplainAccess = true;
        }
      }
    }

    return NextResponse.json({ hasSummaryAccess, hasExplainAccess });
  } catch (error) {
    console.error("[check-access] Error:", error);
    return NextResponse.json({ error: "Access check failed" }, { status: 500 });
  }
}
