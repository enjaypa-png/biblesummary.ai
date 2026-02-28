"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    async function finish() {
      // Give Supabase a moment to parse the hash and set the session
      await new Promise(r => setTimeout(r, 500));
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed_at")
          .eq("user_id", session.user.id)
          .single();
        router.replace(profile?.onboarding_completed_at ? "/bible" : "/onboarding");
      } else {
        router.replace("/login?error=oauth_exchange_failed");
      }
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
