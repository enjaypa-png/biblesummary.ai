"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
 *  2. We explicitly call `exchangeCodeForSession(code)` on `supabaseOAuth`,
 *     which retrieves the PKCE code_verifier from localStorage and exchanges
 *     the code for a session — immune to Safari ITP.
 *  3. We transfer the session to the cookie-based client so SSR/middleware
 *     can read it.
 *  4. Redirect to /bible or /onboarding.
 */
function AuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function finish() {
      const code = searchParams.get("code");

      if (code) {
        // Explicitly exchange the code using the localStorage-based client.
        // This is more reliable than relying on detectSessionInUrl, which
        // only fires during client initialization and can miss the code if
        // the module was already initialized earlier in the session.
        const { data } = await supabaseOAuth.auth.exchangeCodeForSession(code);

        if (data?.session) {
          // Transfer the session to the cookie-based client so that
          // middleware, server components, and API routes can read it.
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

          const onboarded =
            localStorage.getItem("onboarding_completed") ||
            data.session.user?.user_metadata?.onboarding_completed;
          if (onboarded) localStorage.setItem("onboarding_completed", "true");
          router.replace(onboarded ? "/bible" : "/onboarding");
          return;
        }
      }

      // No code in URL — try the cookie-based client in case the exchange
      // already happened server-side (non-Safari path without code forwarding).
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
  }, [router, searchParams]);

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
