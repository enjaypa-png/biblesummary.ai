"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { supabaseOAuth } from "@/lib/supabase-oauth";
import { Suspense } from "react";

/**
 * /auth/complete
 *
 * Handles the OAuth callback entirely client-side using the localStorage-
 * based Supabase client (`supabaseOAuth`).
 *
 * Flow:
 *  1. The page loads with ?code=xxx from Supabase's OAuth redirect.
 *  2. `supabaseOAuth` (which has `detectSessionInUrl: true`) automatically
 *     detects the code and exchanges it for a session using the PKCE
 *     code_verifier stored in localStorage — which Safari ITP cannot touch.
 *  3. We wait for the exchange to complete via `getSession()`.
 *  4. We transfer the session to the cookie-based client so SSR/middleware
 *     can read it.
 *  5. Redirect to /bible or /onboarding.
 */
function AuthComplete() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function finish() {
      // Wait for the localStorage-based client to auto-exchange the code.
      // `getSession()` internally awaits the `initializePromise`, which
      // includes the PKCE code exchange triggered by detectSessionInUrl.
      const {
        data: { session },
      } = await supabaseOAuth.auth.getSession();

      if (session) {
        // Transfer the session to the cookie-based client so that
        // middleware, server components, and API routes can read it.
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        const onboarded =
          localStorage.getItem("onboarding_completed") ||
          session.user?.user_metadata?.onboarding_completed;
        if (onboarded) localStorage.setItem("onboarding_completed", "true");
        router.replace(onboarded ? "/bible" : "/onboarding");
        return;
      }

      // No session from the OAuth client — try the cookie-based client
      // in case the exchange already happened server-side (non-Safari).
      const {
        data: { session: cookieSession },
      } = await supabase.auth.getSession();

      if (cookieSession?.user) {
        const onboarded =
          localStorage.getItem("onboarding_completed") ||
          cookieSession.user.user_metadata?.onboarding_completed;
        if (onboarded) localStorage.setItem("onboarding_completed", "true");
        router.replace(onboarded ? "/bible" : "/onboarding");
        return;
      }

      router.replace("/login?error=oauth_exchange_failed");
    }

    finish();
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{
          borderColor: "var(--border)",
          borderTopColor: "var(--accent)",
        }}
      />
      <p
        className="text-[14px]"
        style={{ color: "var(--secondary)" }}
      >
        Signing you in...
      </p>
    </div>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense>
      <AuthComplete />
    </Suspense>
  );
}
