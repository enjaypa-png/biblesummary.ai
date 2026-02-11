"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase, getCurrentUser, signOut } from "@/lib/supabase";
import { generateFingerprint, getOrCreateSessionToken } from "@/lib/deviceFingerprint";

const PUBLIC_PATHS = ["/login", "/signup", "/onboarding"];

/**
 * Invisible component that tracks user sessions for abuse prevention.
 * - Records device fingerprint + IP on each navigation
 * - Enforces 2 concurrent session limit
 * - Flags suspicious accounts (5+ IPs/fingerprints in 24h)
 */
export default function SessionTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    // Skip public paths
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return;

    // Debounce: don't re-track the same path within the same render cycle
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    async function track() {
      const user = await getCurrentUser();
      if (!user) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const sessionToken = getOrCreateSessionToken();
      const fingerprint = generateFingerprint();

      try {
        const res = await fetch("/api/track-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sessionToken, fingerprint }),
        });

        const data = await res.json();

        if (data.ok === false && data.reason === "session_limit") {
          // This session was invalidated (3rd+ concurrent session)
          await signOut();
          window.location.href = "/login?reason=session_limit";
        }
      } catch {
        // Silently fail — don't block the user experience
      }
    }

    track();
  }, [pathname]);

  return null;
}
