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

const FEATURES = [
  "AI Bible Search — ask any question, get answers with verses",
  "All 66 book summaries",
  "Unlimited verse explanations",
  "Audio playback for every chapter",
  "Summary audio playback",
  "All future AI features included",
  "Priority feature updates",
];

export default function PricingPageClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [premiumStatus, setPremiumStatus] = useState<PlanStatus>("none");

  useEffect(() => {
    async function loadStatus() {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);

      if (!user) {
        setLoading(false);
        return;
      }

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

          if (sub.type === "premium_yearly" || sub.type === "premium_annual" || sub.type === "premium_monthly") {
            if (status !== "none") setPremiumStatus(status);
          }
        }
      }

      setLoading(false);
    }

    loadStatus();
  }, []);

  const isPremium = premiumStatus === "active" || premiumStatus === "canceled";

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

  function PlanButton({
    label,
    planKey,
    product,
  }: {
    label: string;
    planKey: string;
    product: "premium_annual" | "premium_monthly";
  }) {
    if (premiumStatus === "active" || isPremium) {
      return (
        <button
          disabled
          className="w-full py-3.5 rounded-xl text-[15px] font-bold"
          style={{
            backgroundColor: "transparent",
            color: "#22a867",
            border: "2px solid #22a867",
          }}
        >
          Active Plan
        </button>
      );
    }

    if (premiumStatus === "canceled") {
      return (
        <button
          disabled
          className="w-full py-3.5 rounded-xl text-[15px] font-bold"
          style={{
            backgroundColor: "transparent",
            color: "#f59e0b",
            border: "2px solid #f59e0b",
          }}
        >
          Cancels at period end
        </button>
      );
    }

    const isLoading = checkoutLoading === planKey;

    return (
      <button
        onClick={() => handleCheckout(product, planKey)}
        disabled={isLoading || checkoutLoading !== null}
        className="w-full py-3.5 rounded-xl text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: "#7c5cfc", color: "white" }}
        onMouseEnter={(e) => {
          if (!isLoading && checkoutLoading === null) {
            e.currentTarget.style.backgroundColor = "#6a4ae8";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(124,92,252,0.4)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#7c5cfc";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
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
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#faf9f7" }}
    >
      <main className="flex-1 px-5 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#7c5cfc" }}
          >
            Pricing
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1a1510" }}
          >
            Simple, Transparent Pricing
          </h1>
          <p className="text-base max-w-md mx-auto" style={{ color: "#6a655e" }}>
            Read the Bible free forever. Upgrade to unlock AI explanations, book
            summaries, and audio.
          </p>
        </div>

        {error && (
          <div
            className="max-w-2xl mx-auto mb-6 p-3 rounded-xl text-sm text-center"
            style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-7 h-7 border-2 rounded-full animate-spin"
              style={{ borderColor: "#e8e5e0", borderTopColor: "#7c5cfc" }}
            />
          </div>
        ) : (
          <>
            {/* Two pricing cards */}
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-10">

              {/* ── Monthly Card ── */}
              <div
                className="rounded-2xl p-8 flex flex-col cursor-pointer transition-all"
                style={{
                  backgroundColor: "#fff",
                  border: "1.5px solid #e8e5e0",
                  boxShadow: "0 2px 12px rgba(30,40,80,0.06)",
                }}
                onClick={() => !isPremium && handleCheckout("premium_monthly", "monthly")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(124,92,252,0.12)";
                  e.currentTarget.style.borderColor = "#c4b8ff";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(30,40,80,0.06)";
                  e.currentTarget.style.borderColor = "#e8e5e0";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="mb-6">
                  <h2
                    className="text-lg font-bold mb-1"
                    style={{ color: "#1a1510" }}
                  >
                    Premium Monthly
                  </h2>
                  <p className="text-sm" style={{ color: "#6a655e" }}>
                    All features, cancel anytime
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span
                      className="text-5xl font-bold"
                      style={{ color: "#1a1510", fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                      $9.99
                    </span>
                    <span className="text-base pb-2" style={{ color: "#9a958e" }}>
                      /month
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#9a958e" }}>
                    Billed monthly · Cancel anytime
                  </p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "#3a3530" }}>
                      <span style={{ color: "#7c5cfc", flexShrink: 0, marginTop: 1 }}>&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <PlanButton
                  label="Start Monthly Plan →"
                  planKey="monthly"
                  product="premium_monthly"
                />
              </div>

              {/* ── Annual Card (highlighted) ── */}
              <div
                className="rounded-2xl p-8 flex flex-col cursor-pointer transition-all relative"
                style={{
                  backgroundColor: "#fff",
                  border: "2px solid #7c5cfc",
                  boxShadow: "0 4px 24px rgba(124,92,252,0.15)",
                }}
                onClick={() => !isPremium && handleCheckout("premium_annual", "annual")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(124,92,252,0.25)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(124,92,252,0.15)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Best Value badge */}
                <span
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: "#7c5cfc", color: "#fff" }}
                >
                  Best Value — Save 34%
                </span>

                <div className="mb-6 mt-1">
                  <h2
                    className="text-lg font-bold mb-1"
                    style={{ color: "#1a1510" }}
                  >
                    Premium Annual
                  </h2>
                  <p className="text-sm" style={{ color: "#6a655e" }}>
                    All features, all future updates
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span
                      className="text-5xl font-bold"
                      style={{ color: "#7c5cfc", fontFamily: "'Source Serif 4', Georgia, serif" }}
                    >
                      $79
                    </span>
                    <span className="text-base pb-2" style={{ color: "#9a958e" }}>
                      /year
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#9a958e" }}>
                    Just $6.58/month · Billed annually
                  </p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "#3a3530" }}>
                      <span style={{ color: "#7c5cfc", flexShrink: 0, marginTop: 1 }}>&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <PlanButton
                  label="Start Annual Plan →"
                  planKey="annual"
                  product="premium_annual"
                />
              </div>
            </div>

            {/* Free tier */}
            <div className="max-w-4xl mx-auto">
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#fff", border: "1px solid #e8e5e0" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold" style={{ color: "#1a1510" }}>
                    Free Plan
                  </h3>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(34,168,103,0.1)", color: "#22a867" }}
                  >
                    Always Free
                  </span>
                </div>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {[
                    "Full KJV + Clear Bible Translation — all 66 books",
                    "Bookmarks and reading progress tracking",
                    "Personal notes on any verse",
                    "Highlights in 5 colors",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "#3a3530" }}>
                      <span style={{ color: "#22a867", flexShrink: 0, marginTop: 1 }}>&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <p
          className="text-center text-xs leading-relaxed mt-10 max-w-lg mx-auto"
          style={{ color: "#9a958e" }}
        >
          All paid features are optional. ClearBible.ai is an educational reading
          tool. See our{" "}
          <Link href="/refunds" className="underline" style={{ color: "#7c5cfc" }}>
            Refund Policy
          </Link>{" "}
          for details on cancellations and refunds.
        </p>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            href="/bible"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold transition-all"
            style={{ backgroundColor: "#7c5cfc", color: "white", boxShadow: "0 4px 16px rgba(124,92,252,0.3)" }}
          >
            Start Reading for Free
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
