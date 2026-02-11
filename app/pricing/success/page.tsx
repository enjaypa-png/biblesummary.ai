"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PricingSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(!!sessionId);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    async function verify() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setVerifying(false);
          return;
        }

        const res = await fetch("/api/verify-purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        if (res.ok) {
          setVerified(true);
        }
      } catch {
        // Webhook should handle it
      }
      setVerifying(false);
    }

    verify();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "rgba(5, 150, 105, 0.1)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          {verifying ? "Confirming your purchase..." : "Purchase Successful!"}
        </h1>

        {verifying ? (
          <div className="flex items-center justify-center py-4">
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
            />
          </div>
        ) : (
          <>
            <p className="text-[15px] mb-8" style={{ color: "var(--foreground-secondary)" }}>
              {verified
                ? "Your purchase has been confirmed. You now have access to your new features."
                : "Thank you for your purchase! Your features will be available shortly."}
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/summaries"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-95"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                View Summaries
              </Link>
              <Link
                href="/bible"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-95"
                style={{ backgroundColor: "var(--card)", color: "var(--foreground)", border: "0.5px solid var(--border)" }}
              >
                Start Reading
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
