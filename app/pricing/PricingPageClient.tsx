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
  const [summaryAnnualStatus, setSummaryAnnualStatus] = useState<PlanStatus>("none");
  const [explainMonthlyStatus, setExplainMonthlyStatus] = useState<PlanStatus>("none");
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

          switch (sub.type) {
            case "summary_annual":
              setSummaryAnnualStatus(status);
              break;
            case "explain_monthly":
              setExplainMonthlyStatus(status);
              break;
            case "premium_yearly":
              setPremiumStatus(status);
              break;
          }
        }
      }

      setLoading(false);
    }

    loadStatus();
  }, []);

  const isPremium = premiumStatus === "active" || premiumStatus === "canceled";

  async function handleCheckout(
    product: "summary_annual" | "explain_monthly" | "premium_yearly",
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
            Bible text and audio are always free. Pay only for the features you want.
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
                boxShadow: "0 4px 20px rgba(37, 99, 235, 0.15)",
              }}
            >
              <span
                className="absolute -top-3 left-5 text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                Recommended
              </span>

              <div className="flex items-baseline justify-between mb-1 mt-1">
                <h3 className="text-[18px] font-bold" style={{ color: "var(--foreground)" }}>
                  BibleSummary Premium
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
                    $59
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--foreground-secondary)" }}>
                    /year
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
                  <span>All future AI features included</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Priority feature updates</span>
                </li>
              </ul>

              {renderButton(
                "Upgrade to Premium — $59/year",
                "premium",
                premiumStatus,
                false,
                () => handleCheckout("premium_yearly", "premium")
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
                  <span>Full King James Version Bible text — all 66 books</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Audio playback for every chapter</span>
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

            {/* Book Summaries */}
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
                  Book Summaries
                </h3>
              </div>
              <p className="text-[13px] mb-3" style={{ color: "var(--foreground-secondary)" }}>
                AI-generated educational reading tools to help you retain what you read
              </p>

              <div className="space-y-3 mb-4">
                {/* Per book */}
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "var(--background)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                        Per Book
                      </span>
                      <p className="text-[12px]" style={{ color: "var(--foreground-secondary)" }}>
                        Buy individual book summaries
                      </p>
                    </div>
                    <span className="text-[20px] font-bold" style={{ color: "var(--accent)" }}>
                      $0.99
                    </span>
                  </div>
                  {isPremium || summaryAnnualStatus !== "none" ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg text-[14px] font-bold opacity-60"
                      style={{ backgroundColor: "var(--card)", color: "var(--success)", border: "1.5px solid var(--success)" }}
                    >
                      {isPremium ? "Included in Premium" : "Included in Annual Pass"}
                    </button>
                  ) : (
                    <Link
                      href="/summaries"
                      className="block w-full py-2.5 rounded-lg text-[14px] font-bold text-center transition-all active:scale-[0.98]"
                      style={{ backgroundColor: "var(--accent)", color: "white" }}
                    >
                      Browse Books — $0.99 each
                    </Link>
                  )}
                </div>

                {/* Annual pass */}
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "var(--background)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                        Annual Pass
                      </span>
                      <p className="text-[12px]" style={{ color: "var(--foreground-secondary)" }}>
                        All 66 books — less than $0.23 per book
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[20px] font-bold" style={{ color: "var(--accent)" }}>
                        $14.99
                      </span>
                      <span className="text-[13px]" style={{ color: "var(--foreground-secondary)" }}>
                        /year
                      </span>
                    </div>
                  </div>
                  {renderButton(
                    "Get All Summaries — $14.99/year",
                    "annual",
                    summaryAnnualStatus,
                    isPremium,
                    () => handleCheckout("summary_annual", "annual")
                  )}
                </div>
              </div>

              <ul className="space-y-2 text-[14px]" style={{ color: "var(--foreground)" }}>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Detailed summaries covering every chapter of each book</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Listen to summaries read aloud</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Helps you remember and retain what you&apos;ve read</span>
                </li>
              </ul>
            </div>

            {/* Verse Explanations */}
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
                  Verse Explanations
                </h3>
              </div>
              <p className="text-[13px] mb-3" style={{ color: "var(--foreground-secondary)" }}>
                AI-generated plain-language explanations for individual verses
              </p>

              <div
                className="p-3 rounded-lg mb-4"
                style={{ backgroundColor: "var(--background)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                      Monthly
                    </span>
                    <p className="text-[12px]" style={{ color: "var(--foreground-secondary)" }}>
                      Unlimited verse explanations
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[20px] font-bold" style={{ color: "var(--accent)" }}>
                      $4.99
                    </span>
                    <span className="text-[13px]" style={{ color: "var(--foreground-secondary)" }}>
                      /month
                    </span>
                  </div>
                </div>
                {renderButton(
                  "Start Verse Explanations — $4.99/month",
                  "explain",
                  explainMonthlyStatus,
                  isPremium,
                  () => handleCheckout("explain_monthly", "explain")
                )}
              </div>

              <ul className="space-y-2 text-[14px]" style={{ color: "var(--foreground)" }}>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Tap any verse for an instant plain-language explanation</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                  <span>Understand difficult passages without leaving the reading experience</span>
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
          All paid features are optional. BibleSummary.ai is an educational reading tool.
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
