import { supabase, getCurrentUser } from "@/lib/supabase";

/**
 * Check if the current user has access to a specific book's summary.
 * Returns true if user has purchased the book individually OR has an active annual pass.
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

  const { data, error } = await supabase.rpc("user_has_summary_access", {
    p_user_id: user.id,
    p_book_id: bookId,
  });

  return {
    hasAccess: !error && data === true,
    isAuthenticated: true,
    userId: user.id,
  };
}

/**
 * Check if the current user has access to AI verse explanations.
 * Returns true if user has an active monthly explain subscription.
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

  const { data, error } = await supabase.rpc("user_has_explain_access", {
    p_user_id: user.id,
  });

  return {
    hasAccess: !error && data === true,
    isAuthenticated: true,
    userId: user.id,
  };
}

/**
 * Start a checkout session by calling the API route.
 * Redirects the user to Stripe Checkout.
 */
export async function startCheckout(params: {
  product: "summary_single" | "summary_annual" | "explain_monthly";
  bookId?: string;
  bookSlug?: string;
  returnPath?: string;
}): Promise<{ url: string | null; error: string | null }> {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
