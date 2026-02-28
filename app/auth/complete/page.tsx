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

      // Try exchange if we have a code
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // ignore — will fall through to session check
        }
      }

      // Poll for session up to 3 seconds
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 500));
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("onboarding_completed_at")
            .eq("user_id", session.user.id)
            .single();
          router.replace(profile?.onboarding_completed_at ? "/bible" : "/onboarding");
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
