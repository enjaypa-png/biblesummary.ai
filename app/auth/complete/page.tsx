"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

/**
 * /auth/complete
 *
 * Fallback page that checks for an existing session and redirects.
 * The actual code exchange now happens server-side in /auth/callback.
 * This page handles edge cases where a user lands here directly.
 */
function AuthComplete() {
  const router = useRouter();

  useEffect(() => {
    async function finish() {
      // Check if a session already exists (set by the server-side callback)
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const onboarded = localStorage.getItem("onboarding_completed")
            || session.user.user_metadata?.onboarding_completed;
          if (onboarded) localStorage.setItem("onboarding_completed", "true");
          router.replace(onboarded ? "/bible" : "/onboarding");
          return;
        }
        await new Promise(r => setTimeout(r, 500));
      }

      router.replace("/login?error=oauth_exchange_failed");
    }

    finish();
  }, [router]);

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
