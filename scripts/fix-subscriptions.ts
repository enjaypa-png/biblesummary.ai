/**
 * fix-subscriptions.ts
 *
 * Diagnose and fix missing subscription records for users who paid via Stripe
 * but didn't get access granted in the database.
 *
 * Usage:
 *   npx tsx scripts/fix-subscriptions.ts --check              # List all subscriptions
 *   npx tsx scripts/fix-subscriptions.ts --check-email EMAIL   # Check a specific user
 *   npx tsx scripts/fix-subscriptions.ts --grant EMAIL         # Grant premium_yearly to a user
 *   npx tsx scripts/fix-subscriptions.ts --stripe              # Sync from Stripe (checks recent premium subs)
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

async function listAllSubscriptions() {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching subscriptions:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No subscriptions found in the database.");
    return;
  }

  console.log(`\nFound ${data.length} subscription(s):\n`);
  for (const sub of data) {
    const isActive =
      (sub.status === "active" || sub.status === "canceled") &&
      new Date(sub.current_period_end) > new Date();

    console.log(`  User ID:      ${sub.user_id}`);
    console.log(`  Type:         ${sub.type}`);
    console.log(`  Status:       ${sub.status}`);
    console.log(`  Period End:   ${sub.current_period_end}`);
    console.log(`  Stripe Sub:   ${sub.stripe_subscription_id}`);
    console.log(`  Access:       ${isActive ? "YES" : "NO (expired or invalid)"}`);
    console.log("");
  }
}

async function checkUserByEmail(email: string) {
  // Look up user by email
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error("Error listing users:", userError.message);
    return;
  }

  const user = userData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    console.log(`No user found with email: ${email}`);
    return;
  }

  console.log(`\nUser found: ${user.email} (ID: ${user.id})\n`);

  // Check subscriptions
  const { data: subs, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id);

  if (subError) {
    console.error("Error fetching subscriptions:", subError.message);
    return;
  }

  if (!subs || subs.length === 0) {
    console.log("  No subscriptions found for this user.");
    console.log(`  To grant premium access, run: npx tsx scripts/fix-subscriptions.ts --grant ${email}`);
    return;
  }

  for (const sub of subs) {
    const isActive =
      (sub.status === "active" || sub.status === "canceled") &&
      new Date(sub.current_period_end) > new Date();

    console.log(`  Type:         ${sub.type}`);
    console.log(`  Status:       ${sub.status}`);
    console.log(`  Period End:   ${sub.current_period_end}`);
    console.log(`  Stripe Sub:   ${sub.stripe_subscription_id}`);
    console.log(`  Access:       ${isActive ? "YES" : "NO (expired or invalid)"}`);
    console.log("");
  }

  // Check purchases
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", user.id);

  if (purchases && purchases.length > 0) {
    console.log(`  Purchases: ${purchases.length} record(s)`);
    for (const p of purchases) {
      console.log(`    - ${p.type} | book_id: ${p.book_id || "N/A"} | ${p.stripe_payment_id}`);
    }
  }
}

async function grantPremium(email: string) {
  // Look up user by email
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error("Error listing users:", userError.message);
    return;
  }

  const user = userData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    console.log(`No user found with email: ${email}`);
    return;
  }

  console.log(`\nGranting premium_yearly to ${user.email} (${user.id})...\n`);

  // Set period to 1 year from now
  const now = new Date();
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const { error: upsertError } = await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      type: "premium_yearly",
      stripe_subscription_id: `manual_grant_${Date.now()}`,
      stripe_customer_id: `manual_grant_${user.id}`,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: oneYearFromNow.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id,type" }
  );

  if (upsertError) {
    console.error("Failed to grant access:", upsertError.message);
    return;
  }

  console.log("  Premium access granted successfully!");
  console.log(`  Period: ${now.toISOString()} → ${oneYearFromNow.toISOString()}`);
  console.log("  The user should now have access to all summaries, explanations, and audio.");
}

async function syncFromStripe() {
  if (!stripeSecretKey) {
    console.error("Missing STRIPE_SECRET_KEY in .env.local");
    return;
  }

  const stripe = new Stripe(stripeSecretKey);

  console.log("\nFetching recent Stripe subscriptions...\n");

  // Get recent active subscriptions
  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    limit: 50,
    expand: ["data.customer"],
  });

  if (subscriptions.data.length === 0) {
    console.log("No active subscriptions found in Stripe.");
    return;
  }

  let synced = 0;

  for (const sub of subscriptions.data) {
    const metadata = sub.metadata || {};
    const userId = metadata.user_id;
    const productType = metadata.product_type;

    if (!userId) {
      const customer = sub.customer as Stripe.Customer;
      console.log(`  Skipping sub ${sub.id} — no user_id in metadata (customer: ${customer?.email || "unknown"})`);
      continue;
    }

    // Map product type to DB type
    let dbType: string;
    switch (productType) {
      case "premium_annual":
      case "premium_monthly":
        dbType = "premium_yearly";
        break;
      default:
        dbType = productType || "premium_yearly";
    }

    const firstItem = sub.items?.data?.[0];
    const periodStart = new Date((firstItem?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
    const periodEnd = new Date((firstItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 365) * 1000).toISOString();

    const { error: upsertError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        type: dbType,
        stripe_subscription_id: sub.id,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        status: "active",
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,type" }
    );

    if (upsertError) {
      console.error(`  Failed to sync ${sub.id}:`, upsertError.message);
    } else {
      const customer = sub.customer as Stripe.Customer;
      console.log(`  Synced: ${customer?.email || userId} → ${dbType} (active until ${periodEnd})`);
      synced++;
    }
  }

  console.log(`\nDone. Synced ${synced} subscription(s).`);
}

async function main() {
  switch (command) {
    case "--check":
      await listAllSubscriptions();
      break;
    case "--check-email":
      if (!param) {
        console.error("Usage: npx tsx scripts/fix-subscriptions.ts --check-email EMAIL");
        process.exit(1);
      }
      await checkUserByEmail(param);
      break;
    case "--grant":
      if (!param) {
        console.error("Usage: npx tsx scripts/fix-subscriptions.ts --grant EMAIL");
        process.exit(1);
      }
      await grantPremium(param);
      break;
    case "--stripe":
      await syncFromStripe();
      break;
    default:
      console.log("fix-subscriptions — Diagnose and fix missing subscription records\n");
      console.log("Commands:");
      console.log("  --check              List all subscriptions in the database");
      console.log("  --check-email EMAIL  Check a specific user's access");
      console.log("  --grant EMAIL        Manually grant premium_yearly to a user");
      console.log("  --stripe             Sync all active subscriptions from Stripe to database");
      break;
  }
}

main().catch(console.error);
