"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { startCheckout } from "@/lib/entitlements";
import Footer from "@/components/Footer";

interface Subscription {
  type: string;
  status: string;
  current_period_end: string;
}

type PlanStatus = "none" | "active" | "canceled";

export default function PricingPageClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscription statuses
  const [premiumStatus, setPremiumStatus] = useState<PlanStatus>("none");

  useEffect(() => {
    async function loadStatus() {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all subscriptions for this user
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("type, status, current_period_end")
        .eq("user_id", user.id);

      if (subs) {
        for (const sub of subs as Subscription[]) {
          const isActive =
            (sub.status === "active" || sub.status === "canceled") &&
            new Date(sub.current_period_end) > new Date();

          const status: PlanStatus = isActive
            ? sub.status === "active"
              ? "active"
              : "canceled"
            : "none";

          if (sub.type === "premium_annual" || sub.type === "premium_monthly") {
            setPremiumStatus(status);
          }
        }
      }

      setLoading(false);
    }

    loadStatus();
  }, []);

  const isPremium = premiumStatus === "active" || premiumStatus === "canceled";
  const [billingCycle, setBillingCycle] = useState<"yearly" | "monthly">("yearly");

  async function handleCheckout(
    product: "premium_annual" | "premium_monthly",
    key: string
  ) {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent("/pricing")}`;
      return;
    }

    setError(null);
    setCheckoutLoading(key);

    const result = await startCheckout({
      product,
      returnPath: "/pricing/success",
    });

    if (result.error) {
      setError(result.error);
      setCheckoutLoading(null);
    } else if (result.url) {
      window.location.href = result.url;
    }
  }

  function renderButton(
    label: string,
    key: string,
    planStatus: PlanStatus,
    overridden: boolean,
    onClick: () => void
  ) {
    // Already active
    if (planStatus === "active" || overridden) {
      return (
        <button
          disabled
          className="w-full py-3 rounded-xl text-[15px] font-bold opacity-60"
          style={{ backgroundColor: "var(--card)", color: "var(--success)", border: "1.5px solid var(--success)" }}
        >
          Active
        </button>
      );
    }

    // Canceled but still within period
    if (planStatus === "canceled") {
      return (
        <button
          disabled
          className="w-full py-3 rounded-xl text-[15px] font-bold opacity-70"
          style={{ backgroundColor: "var(--card)", color: "var(--warning)", border: "1.5px solid var(--warning)" }}
        >
          Cancels at period end
        </button>
      );
    }

    const isLoading = checkoutLoading === key;

    return (
      <button
        onClick={onClick}
        disabled={isLoading || checkoutLoading !== null}
        className="w-full py-3 rounded-xl text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: "var(--accent)", color: "white" }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          label
        )}
      </button>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--background-blur)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            &larr; Home
          </Link>
          <h1 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
            Pricing
          </h1>
          <span className="w-[50px]" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-[15px]" style={{ color: "var(--foreground-secondary)" }}>
            Read free forever. Upgrade for audio, AI explanations, and summaries.
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-[14px] text-center"
            style={{ backgroundColor: "#fef2f2", color: "var(--error)" }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* ⭐ Premium Tier — highlighted */}
            <div
              className="rounded-xl p-5 relative"
              style={{
                backgroundColor: "var(--card)",
                border: "2px solid var(--accent)",
                boxShadow: "0 4px 20px rgba(124, 92, 252, 0.15)",
              }}
            >
              <span
                className="absolute -top-3 left-5 text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                Recommended
              </span>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }} className="mt-1">
                  <button
                    onClick={() => setBillingCycle("yearly")}
                    className="flex-1 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
                    style={{ backgroundColor: billingCycle === "yearly" ? "var(--accent)" : "var(--background)", color: billingCycle === "yearly" ? "white" : "var(--foreground)", border: "1px solid var(--border)" }}
                  >Annually — $79</button>
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className="flex-1 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
                    style={{ backgroundColor: billingCycle === "monthly" ? "var(--accent)" : "var(--background)", color: billingCycle === "monthly" ? "white" : "var(--foreground)", border: "1px solid var(--border)" }}
                  >Monthly — $9.99</button>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-[18px] font-bold" style={{ color: "var(--foreground)" }}>
                  ClearBible Premium
                </h3>
              </div>
              <p className="text-[13px] mb-4" style={{ color: "var(--foreground-secondary)" }}>
                Everything included — one simple price
              </p>

              <div
                className="flex items-center justify-between p-3 rounded-lg mb-4"
                style={{ backgroundColor: "var(--background)" }}
              >
                <div>
                  <span className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                    Yearly
                  </span>
                  <p className="text-[12px]" style={{ color: "var(--foreground-secondary)" }}>
                    All features, all future updates
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[24px] font-bold" style={{ color: "var(--accent)" }}>
                    {billingCycle === "yearly" ? "$79" : "$9.99"}
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--foreground-secondary)" }}>
                    {billingCycle === "yearly" ? "/year" : "/month"}
                  </span>
                </div>
              </div>

              <ul className="space-y-2 text-[14px] mb-5" style={{ color: "var(--foreground)" }}>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>All 66 book summaries</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Unlimited verse explanations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Summary audio playback</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Audio playback for every chapter</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>All future AI features included</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Priority feature updates</span>
                </li>
              </ul>

              {renderButton(
                billingCycle === "yearly" ? "Upgrade to Premium — $79/year" : "Upgrade to Premium — $9.99/month",
                "premium",
                premiumStatus,
                false,
                () => handleCheckout(billingCycle === "yearly" ? "premium_annual" : "premium_monthly", "premium")
              )}
            </div>

            {/* Free tier */}
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
                  Free
                </h3>
                <span
                  className="text-[13px] font-medium px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(5, 150, 105, 0.1)", color: "var(--success)" }}
                >
                  Always free
                </span>
              </div>
              <ul className="space-y-2 text-[14px]" style={{ color: "var(--foreground)" }}>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Full KJV + Clear Bible Translation — all 66 books</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Bookmarks and reading progress tracking</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Personal notes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Search across the entire Bible</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p
          className="text-center text-[12px] leading-relaxed mt-8"
          style={{ color: "var(--foreground-secondary)" }}
        >
          All paid features are optional. ClearBible.ai is an educational reading tool.
          AI-generated content describes what the biblical text contains without interpretation.
          See our{" "}
          <Link href="/refunds" className="underline" style={{ color: "var(--accent)" }}>
            Refund Policy
          </Link>{" "}
          for details on cancellations and refunds.
        </p>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            href="/bible"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-[16px] font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            Start Reading for Free
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
