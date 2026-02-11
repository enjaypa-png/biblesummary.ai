import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/record-summary-view
 *
 * Records a summary view and checks the rate limit (200/day per account).
 * Call this when a user views a summary they've paid for.
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Authenticate
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
  if (authError || !user) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }

  try {
    const { bookId } = await req.json();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limit first
    const { data: withinLimit } = await supabase.rpc("check_summary_rate_limit", {
      p_user_id: user.id,
    });

    if (withinLimit !== true) {
      return NextResponse.json({
        allowed: false,
        error: "Daily summary view limit reached. Please try again tomorrow.",
      });
    }

    // Record the view
    await supabase.from("summary_access_log").insert({
      user_id: user.id,
      book_id: bookId || null,
      ip_address: ip,
    });

    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error("Record summary view error:", error);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
