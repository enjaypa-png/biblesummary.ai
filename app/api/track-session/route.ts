import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/track-session
 *
 * Records the current user session (device fingerprint + IP).
 * Enforces a maximum of 2 concurrent active sessions.
 * Checks for abuse (5+ distinct IPs or fingerprints in 24h).
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
    const { sessionToken, fingerprint } = await req.json();

    if (!sessionToken || typeof sessionToken !== "string") {
      return NextResponse.json({ error: "Missing session token" }, { status: 400 });
    }

    // Get IP and user agent from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Upsert this session
    await supabase.from("user_sessions").upsert(
      {
        user_id: user.id,
        session_token: sessionToken,
        device_fingerprint: fingerprint || null,
        ip_address: ip,
        user_agent: userAgent,
        is_active: true,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "user_id,session_token" }
    );

    // Enforce 2 concurrent session limit
    const { data: activeSessions } = await supabase
      .from("user_sessions")
      .select("id, session_token, last_active_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("last_active_at", { ascending: false });

    if (activeSessions && activeSessions.length > 2) {
      // Invalidate all but the 2 most recent
      const toInvalidate = activeSessions.slice(2).map((s) => s.id);
      await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .in("id", toInvalidate);

      // Check if THIS session was the one invalidated
      const thisWasInvalidated = activeSessions
        .slice(2)
        .some((s) => s.session_token === sessionToken);

      if (thisWasInvalidated) {
        return NextResponse.json({ ok: false, reason: "session_limit" });
      }
    }

    // Check for abuse (5+ distinct IPs or fingerprints in 24h)
    const { data: isSuspicious } = await supabase.rpc("check_account_suspicious", {
      p_user_id: user.id,
    });

    return NextResponse.json({
      ok: true,
      suspicious: isSuspicious === true,
    });
  } catch (error) {
    console.error("Track session error:", error);
    return NextResponse.json({ error: "Failed to track session" }, { status: 500 });
  }
}
