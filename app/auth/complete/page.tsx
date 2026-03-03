"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

function AuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function finish() {
      const code = searchParams.get("code");

      // Clear any stale session before exchanging — prevents
      // "Refresh Token Not Found" when a corrupted session lingers
      // (especially common on Safari)
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // ignore — may not have a session to clear
      }

      // Try exchange if we have a code
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[auth/complete] exchangeCodeForSession error:", error.message);
          }
        } catch (err) {
          console.error("[auth/complete] exchangeCodeForSession threw:", err);
        }
      }

      // Poll for session up to 5 seconds (Safari can be slow to persist)
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 500));
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const onboarded = localStorage.getItem("onboarding_completed")
            || session.user.user_metadata?.onboarding_completed;
          if (onboarded) localStorage.setItem("onboarding_completed", "true");
          router.replace(onboarded ? "/bible" : "/onboarding");
          return;
        }
      }

      router.replace("/login?error=oauth_exchange_failed");
    }

    finish();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "var(--background)" }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
      <p className="text-[14px]" style={{ color: "var(--foreground-secondary)" }}>
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
