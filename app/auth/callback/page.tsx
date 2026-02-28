"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[OAuth] Exchange error:", error.message);
            setStatus("Something went wrong. Redirecting...");
            setTimeout(() => router.replace("/login?error=oauth_exchange_failed"), 1500);
            return;
          }
        }

        // Wait for session to be confirmed
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Check onboarding
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("onboarding_completed_at")
            .eq("user_id", session.user.id)
            .single();

          if (!profile?.onboarding_completed_at) {
            router.replace("/onboarding");
          } else {
            router.replace("/bible");
          }
        } else {
          // Try once more after a short delay
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession?.user) {
              router.replace("/bible");
            } else {
              router.replace("/login?error=oauth_exchange_failed");
            }
          }, 1000);
        }
      } catch (err) {
        console.error("[OAuth] Unexpected error:", err);
        router.replace("/login?error=oauth_exchange_failed");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
      />
      <p className="text-[14px]" style={{ color: "var(--foreground-secondary)" }}>
        {status}
      </p>
    </div>
  );
}
