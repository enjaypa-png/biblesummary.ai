"use client";

import { useState } from "react";
import Link from "next/link";
import { startCheckout } from "@/lib/entitlements";

interface SummaryPaywallProps {
  bookName: string;
  bookId?: string;
  bookSlug?: string;
  isAuthenticated?: boolean;
}

export default function SummaryPaywall({
  bookName,
  bookId,
  bookSlug,
  isAuthenticated = false,
}: SummaryPaywallProps) {
  const [loading, setLoading] = useState<"single" | "annual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase(type: "single" | "annual") {
    setLoading(type);
    setError(null);

    const { url, error: checkoutError } = await startCheckout({
      product: type === "single" ? "summary_single" : "summary_annual",
      bookId: type === "single" ? bookId : undefined,
      bookSlug: type === "single" ? bookSlug : undefined,
      returnPath: bookSlug ? `/summaries/${bookSlug}` : "/summaries",
    });

    if (checkoutError) {
      setError(checkoutError);
      setLoading(null);
      return;
    }

    if (url) {
      window.location.href = url;
    } else {
      setError("Unable to start checkout. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <div
        className="rounded-xl p-6 text-center"
        style={{
          backgroundColor: "var(--card)",
          border: "0.5px solid var(--border)",
        }}
      >
        {/* Lock icon */}
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--accent-light, rgba(124, 92, 252, 0.1))" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--foreground)" }}
        >
          {bookName} Summary
        </h2>

        <p
          className="text-[14px] leading-relaxed mb-6 max-w-sm mx-auto"
          style={{ color: "var(--secondary)" }}
        >
          Book summaries help with retention and understanding. Purchase a single
          book or unlock all summaries for a full year.
        </p>

        {!isAuthenticated ? (
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-full text-[14px] font-semibold transition-opacity active:opacity-80"
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
          >
            Sign in to unlock
          </Link>
        ) : (
          <div className="space-y-3">
            {/* Per-book purchase */}
            {bookId && (
              <button
                onClick={() => handlePurchase("single")}
                disabled={loading !== null}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-left transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#ffffff",
                }}
              >
                <div>
                  <div className="text-[14px] font-semibold">
                    {bookName} Summary
                  </div>
                  <div className="text-[12px] opacity-80">
                    One-time purchase
                  </div>
                </div>
                <div className="text-[16px] font-bold">
                  {loading === "single" ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "$0.99"
                  )}
                </div>
              </button>
            )}

            {/* Annual pass */}
            <button
              onClick={() => handlePurchase("annual")}
              disabled={loading !== null}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-left transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                backgroundColor: "var(--background)",
                border: "1.5px solid var(--accent)",
                color: "var(--foreground)",
              }}
            >
              <div>
                <div className="text-[14px] font-semibold">
                  All 66 Books
                </div>
                <div
                  className="text-[12px]"
                  style={{ color: "var(--secondary)" }}
                >
                  Annual pass — every book unlocked
                </div>
              </div>
              <div
                className="text-[16px] font-bold"
                style={{ color: "var(--accent)" }}
              >
                {loading === "annual" ? (
                  <span
                    className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
                  />
                ) : (
                  "$14.99/yr"
                )}
              </div>
            </button>

            {error && (
              <p className="text-[13px] mt-2" style={{ color: "var(--error)" }}>
                {error}
              </p>
            )}

            <p
              className="text-[12px] mt-3 leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              Bible reading and audio are free forever.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
