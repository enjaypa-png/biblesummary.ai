"use client";

import { useState } from "react";
import Link from "next/link";
import { startCheckout } from "@/lib/entitlements";

interface ExplainPaywallProps {
  isAuthenticated: boolean;
  onClose: () => void;
}

export default function ExplainPaywall({
  isAuthenticated,
  onClose,
}: ExplainPaywallProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);

    const { url, error: checkoutError } = await startCheckout({
      product: "explain_monthly",
      returnPath: typeof window !== "undefined" ? window.location.pathname : "/bible",
    });

    if (checkoutError) {
      setError(checkoutError);
      setLoading(false);
      return;
    }

    if (url) {
      window.location.href = url;
    } else {
      setError("Unable to start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <span
      className="block my-3 rounded-xl p-5"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <span className="flex items-start justify-between gap-3 mb-3">
        <span
          className="text-[12px] uppercase tracking-wider font-semibold"
          style={{ color: "var(--accent)" }}
        >
          AI Verse Explanations
        </span>
        <button
          onClick={onClose}
          className="text-[12px] font-medium"
          style={{ color: "var(--secondary)" }}
        >
          Close
        </button>
      </span>

      {/* Lock icon */}
      <span className="flex justify-center mb-3">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
      </span>

      {/* Copy - exact verbatim from spec */}
      <span
        className="block text-[14px] leading-relaxed text-center mb-4"
        style={{ color: "var(--foreground)" }}
      >
        Verse explanations use AI and cost real money to provide. Bible reading
        and audio are free forever. AI features are optional.
      </span>

      {!isAuthenticated ? (
        <span className="block text-center">
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-full text-[14px] font-semibold transition-opacity active:opacity-80"
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
          >
            Sign in to unlock
          </Link>
        </span>
      ) : (
        <span className="block space-y-2">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              backgroundColor: "var(--accent)",
              color: "#ffffff",
            }}
          >
            <span>
              <span className="block text-[14px] font-semibold">
                Unlimited Explanations
              </span>
              <span className="block text-[12px] opacity-80">
                Monthly subscription
              </span>
            </span>
            <span className="text-[16px] font-bold">
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "$4.99/mo"
              )}
            </span>
          </button>

          {error && (
            <span
              className="block text-[13px] text-center"
              style={{ color: "var(--error)" }}
            >
              {error}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
