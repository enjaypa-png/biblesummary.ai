"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, supabase } from "@/lib/supabase";

/**
 * Onboarding page — temporarily disabled.
 * Marks onboarding as complete and redirects to /bible.
 */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    async function skipOnboarding() {
      const user = await getCurrentUser();
      if (user) {
        // Mark onboarding complete so the user isn't redirected back here
        await supabase.from("user_profiles").upsert({
          user_id: user.id,
          onboarding_completed_at: new Date().toISOString(),
        });
      }
      router.replace("/bible");
    }
    skipOnboarding();
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--background)" }}
    >
      <span
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{
          borderColor: "var(--border)",
          borderTopColor: "var(--accent)",
        }}
      />
    </div>
  );
}
