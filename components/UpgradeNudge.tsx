"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, supabase } from "@/lib/supabase";

const NUDGE_AFTER_SESSIONS = 3;
const NUDGE_DISMISS_KEY = "upgrade_nudge_dismissed_at";

export default function UpgradeNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    async function check() {
      // Don't show if dismissed in last 7 days
      const dismissed = localStorage.getItem(NUDGE_DISMISS_KEY);
      if (dismissed) {
        const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }

      const user = await getCurrentUser();
      if (!user) return;

      // Check if user already has paid access
      const { data: isPremium } = await supabase.rpc("user_has_explain_access", {
        p_user_id: user.id,
      });
      if (isPremium) return;

      // Check session count
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("session_count")
        .eq("user_id", user.id)
        .single();

      const sessions = profile?.session_count ?? 0;
      if (sessions >= NUDGE_AFTER_SESSIONS) {
        setShow(true);
      }
    }
    check();
  }, []);

  function dismiss() {
    localStorage.setItem(NUDGE_DISMISS_KEY, Date.now().toString());
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-50 px-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="max-w-sm mx-auto rounded-2xl p-4 shadow-lg"
        style={{
          backgroundColor: "var(--card)",
          border: "1.5px solid var(--accent)",
          pointerEvents: "all",
          boxShadow: "0 8px 32px rgba(124, 92, 252, 0.2)",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
              ✨ You&apos;re making real progress
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--foreground-secondary)" }}>
              Unlock AI verse explanations, audio, and book summaries.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="text-[18px] leading-none flex-shrink-0"
            style={{ color: "var(--foreground-secondary)" }}
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <Link
            href="/pricing"
            onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-center transition-all active:scale-[0.98]"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            Upgrade to Premium
          </Link>
          <button
            onClick={dismiss}
            className="px-4 py-2.5 rounded-xl text-[13px] font-medium"
            style={{ backgroundColor: "var(--background)", color: "var(--foreground-secondary)", border: "0.5px solid var(--border)" }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
