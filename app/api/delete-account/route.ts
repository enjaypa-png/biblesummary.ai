import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Authenticate user
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const accessToken = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Validate confirmation
  let body: { confirmation?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.confirmation !== "DELETE") {
    return NextResponse.json({ error: "Confirmation text required" }, { status: 400 });
  }

  const userId = user.id;
  const userEmail = user.email ?? null;

  try {
    // 1. Cancel active Stripe subscriptions (if any)
    let stripeCustomerId: string | null = null;

    const { data: stripeCustomer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (stripeCustomer?.stripe_customer_id) {
      stripeCustomerId = stripeCustomer.stripe_customer_id;

      // Find and cancel all active subscriptions in Stripe
      const { data: activeSubs } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", userId)
        .in("status", ["active", "trialing", "past_due"]);

      if (activeSubs && activeSubs.length > 0 && process.env.STRIPE_SECRET_KEY) {
        const stripe = getStripe();
        for (const sub of activeSubs) {
          if (sub.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(sub.stripe_subscription_id);
            } catch (stripeErr) {
              console.error(`Failed to cancel Stripe subscription ${sub.stripe_subscription_id}:`, stripeErr);
            }
          }
        }
      }
    }

    // 2. Delete all user-owned data
    // Order matters for tables without CASCADE constraints
    const tables = [
      "bookmarks",
      "highlights",
      "notes",
      "reading_progress",
      "user_sessions",
      "summary_access_log",
      "purchases",
      "subscriptions",
      "stripe_customers",
      "user_profiles",
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) {
        console.error(`Failed to delete from ${table}:`, error);
      }
    }

    // 3. Log deletion in audit table
    await supabase.from("account_deletions").insert({
      user_id: userId,
      email: userEmail,
      stripe_customer_id: stripeCustomerId,
      metadata: {
        deleted_tables: tables,
        had_stripe: !!stripeCustomerId,
      },
    });

    // 4. Delete the user from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please contact support." },
      { status: 500 }
    );
  }
}
