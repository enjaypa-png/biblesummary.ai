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
  const [loading, setLoading] = useState<"monthly" | "premium" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(plan: "monthly" | "premium") {
    setLoading(plan);
    setError(null);

    const { url, error: checkoutError } = await startCheckout({
      product: plan === "monthly" ? "explain_monthly" : "premium_yearly",
      returnPath: typeof window !== "undefined" ? window.location.pathname : "/bible",
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
          style={{ backgroundColor: "var(--accent-light, rgba(124, 92, 252, 0.1))" }}
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

      {/* Copy */}
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
          {/* Monthly option */}
          <button
            onClick={() => handleSubscribe("monthly")}
            disabled={loading !== null}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              backgroundColor: "var(--accent)",
              color: "#ffffff",
            }}
          >
            <span>
              <span className="block text-[14px] font-semibold">
                Verse Explanations
              </span>
              <span className="block text-[12px] opacity-80">
                Monthly subscription
              </span>
            </span>
            <span className="text-[16px] font-bold">
              {loading === "monthly" ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "$4.99/mo"
              )}
            </span>
          </button>

          {/* Premium yearly option */}
          <button
            onClick={() => handleSubscribe("premium")}
            disabled={loading !== null}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              backgroundColor: "var(--background)",
              border: "1.5px solid var(--accent)",
              color: "var(--foreground)",
            }}
          >
            <span>
              <span className="flex items-center gap-2">
                <span className="block text-[14px] font-semibold">
                  Premium
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                >
                  Best Value
                </span>
              </span>
              <span
                className="block text-[12px]"
                style={{ color: "var(--secondary)" }}
              >
                Explanations + all summaries + audio
              </span>
            </span>
            <span
              className="text-[16px] font-bold"
              style={{ color: "var(--accent)" }}
            >
              {loading === "premium" ? (
                <span
                  className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
                />
              ) : (
                "$59/yr"
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
