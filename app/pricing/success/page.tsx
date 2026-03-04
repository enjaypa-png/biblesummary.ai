"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPurchaseWithRetry } from "@/lib/entitlements";

export default function PricingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const checkoutStatus = searchParams.get("checkout");
  const [verifying, setVerifying] = useState(!!sessionId);
  const [verified, setVerified] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // If user landed here without a session_id (e.g. cancel redirect, direct nav, back button),
    // redirect them to pricing — there's nothing to show on a success page
    if (!sessionId) {
      router.replace("/pricing");
      return;
    }

    async function verify() {
      const ok = await verifyPurchaseWithRetry(sessionId!);
      if (ok) {
        setVerified(true);
      } else {
        setFailed(true);
      }
      setVerifying(false);
    }

    verify();
  }, [sessionId, router]);

  // While redirecting (no session_id), show nothing
  if (!sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: failed ? "rgba(220, 38, 38, 0.1)" : "rgba(5, 150, 105, 0.1)" }}
        >
          {failed ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--error, #dc2626)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          {verifying
            ? "Confirming your purchase..."
            : failed
              ? "Purchase Not Confirmed"
              : "Purchase Successful!"}
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
                : failed
                  ? "We couldn't confirm your payment. If you were charged, your access will activate shortly. Otherwise, please try again."
                  : "Thank you for your purchase! Your features will be available shortly."}
            </p>

            <div className="flex flex-col gap-3">
              {failed ? (
                <>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-95"
                    style={{ backgroundColor: "var(--accent)", color: "white" }}
                  >
                    Back to Pricing
                  </Link>
                  <Link
                    href="/bible"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-95"
                    style={{ backgroundColor: "var(--card)", color: "var(--foreground)", border: "0.5px solid var(--border)" }}
                  >
                    Continue Reading
                  </Link>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
