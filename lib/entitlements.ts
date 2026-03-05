import { supabase, getCurrentUser } from "@/lib/supabase";

/**
 * Call the server-side /api/check-access endpoint which checks the DB first,
 * then falls back to Stripe directly if the DB has no record.
 * If Stripe confirms an active subscription, the endpoint self-heals the DB.
 */
async function checkAccessViaApi(bookId?: string): Promise<{
  hasSummaryAccess: boolean;
  hasExplainAccess: boolean;
} | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const res = await fetch("/api/check-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bookId }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Check if the current user has access to a specific book's summary.
 *
 * 1. Checks the DB via Supabase RPC (fast path).
 * 2. If DB says no, calls /api/check-access which verifies with Stripe
 *    and self-heals the DB if Stripe confirms an active subscription.
 */
export async function checkSummaryAccess(bookId: string): Promise<{
  hasAccess: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { hasAccess: false, isAuthenticated: false, userId: null };
  }

  // Fast path: check DB via RPC
  const { data, error } = await supabase.rpc("user_has_summary_access", {
    p_user_id: user.id,
    p_book_id: bookId,
  });

  if (!error && data === true) {
    return { hasAccess: true, isAuthenticated: true, userId: user.id };
  }

  // Fallback: verify against Stripe directly and self-heal DB
  const apiResult = await checkAccessViaApi(bookId);
  if (apiResult?.hasSummaryAccess) {
    return { hasAccess: true, isAuthenticated: true, userId: user.id };
  }

  return { hasAccess: false, isAuthenticated: true, userId: user.id };
}

/**
 * Check if the current user has access to AI verse explanations.
 *
 * 1. Checks the DB via Supabase RPC (fast path).
 * 2. If DB says no, calls /api/check-access which verifies with Stripe
 *    and self-heals the DB if Stripe confirms an active subscription.
 */
export async function checkExplainAccess(): Promise<{
  hasAccess: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { hasAccess: false, isAuthenticated: false, userId: null };
  }

  // Fast path: check DB via RPC
  const { data, error } = await supabase.rpc("user_has_explain_access", {
    p_user_id: user.id,
  });

  if (!error && data === true) {
    return { hasAccess: true, isAuthenticated: true, userId: user.id };
  }

  // Fallback: verify against Stripe directly and self-heal DB
  const apiResult = await checkAccessViaApi();
  if (apiResult?.hasExplainAccess) {
    return { hasAccess: true, isAuthenticated: true, userId: user.id };
  }

  return { hasAccess: false, isAuthenticated: true, userId: user.id };
}

/**
 * Verify a Stripe checkout session with retries.
 * Stripe may take a moment to settle payment status after redirect,
 * so we retry a few times before giving up.
 */
export async function verifyPurchaseWithRetry(
  sessionId: string,
  { maxAttempts = 8, intervalMs = 2000 }: { maxAttempts?: number; intervalMs?: number } = {}
): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch("/api/verify-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) return true;
    } catch {
      // Network error — retry
    }
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  return false;
}

/**
 * Start a checkout session by calling the API route.
 * Redirects the user to Stripe Checkout.
 */
export async function startCheckout(params: {
  product: "summary_single" | "summary_annual" | "explain_monthly" | "premium_annual" | "premium_monthly";
  bookId?: string;
  bookSlug?: string;
  returnPath?: string;
}): Promise<{ url: string | null; error: string | null }> {
  try {
    // Get the current session token to send to the API route
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { url: null, error: "Please sign in to continue." };
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return { url: null, error: data.error || "Failed to create checkout session" };
    }

    return { url: data.url, error: null };
  } catch {
    return { url: null, error: "Network error. Please try again." };
  }
}
