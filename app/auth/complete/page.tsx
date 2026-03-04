"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

/**
 * /auth/complete
 *
 * Client-side fallback for the OAuth flow.
 *
 * Two entry points:
 *  A) With ?code= : server-side exchange in /auth/callback failed
 *     (typically because Safari ITP stripped the PKCE verifier cookie).
 *     We restore the verifier from sessionStorage → document.cookie and
 *     retry exchangeCodeForSession client-side.
 *
 *  B) Without code: just poll for an existing session and redirect.
 */
function AuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    async function finish() {
      // ── Path A: code present — try client-side PKCE exchange ──
      if (code) {
        // Restore PKCE verifier cookies from sessionStorage backup.
        // The login page saves them before redirecting to Google.
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith("pkce_backup:")) {
              const cookieName = key.slice("pkce_backup:".length);
              const cookieValue = sessionStorage.getItem(key);
              if (cookieValue && !document.cookie.includes(cookieName)) {
                document.cookie = `${cookieName}=${cookieValue}; path=/; SameSite=Lax`;
              }
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => sessionStorage.removeItem(k));
        } catch {
          // sessionStorage unavailable — proceed anyway
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const onboarded =
              localStorage.getItem("onboarding_completed") ||
              session.user.user_metadata?.onboarding_completed;
            if (onboarded) localStorage.setItem("onboarding_completed", "true");
            router.replace(onboarded ? "/bible" : "/onboarding");
            return;
          }
        }

        // Client-side exchange also failed — show error
        console.error("[auth/complete] Client-side exchange failed:", error?.message);
        router.replace("/login?error=oauth_exchange_failed");
        return;
      }

      // ── Path B: no code — poll for existing session ──
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const onboarded =
            localStorage.getItem("onboarding_completed") ||
            session.user.user_metadata?.onboarding_completed;
          if (onboarded) localStorage.setItem("onboarding_completed", "true");
          router.replace(onboarded ? "/bible" : "/onboarding");
          return;
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      router.replace("/login?error=oauth_exchange_failed");
    }

    finish();
  }, [router, code]);

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
        style={{ color: "var(--foreground-secondary)" }}
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
