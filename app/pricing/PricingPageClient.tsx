"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { startCheckout } from "@/lib/entitlements";
import Footer from "@/components/Footer";
import BrandName from "@/components/BrandName";

interface Subscription {
  type: string;
  status: string;
  current_period_end: string;
}

type PlanStatus = "none" | "active" | "canceled";

const FEATURES = [
  { bold: "AI Bible Search", rest: " — ask any question, get answers with verses" },
  { bold: "All 66 Book Summaries", rest: " — understand each book at a glance" },
  { bold: "Unlimited Verse Explanations", rest: " — plain English, instantly" },
  { bold: "Audio Playback", rest: " for every chapter and summary" },
  { bold: "Apply Scripture to My Life", rest: " — personal application for any verse" },
  { bold: "Highlights & Notes", rest: " — mark up and annotate freely" },
  { bold: "All Future Features", rest: " included automatically" },
  { bold: "Priority Updates", rest: " — first access to new tools" },
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

          if (sub.type === "premium_yearly" || sub.type === "premium_monthly") {
            setPremiumStatus(status);
          }
        }
      }

      setLoading(false);
    }

    loadStatus();
  }, []);

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

  function renderCTAButton() {
    if (loading) {
      return (
        <div
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: 9999,
            background: "#e5e0f0",
            textAlign: "center",
            color: "#8a8580",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Loading...
        </div>
      );
    }

    if (premiumStatus === "active") {
      return (
        <div
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: 9999,
            background: "rgba(5, 150, 105, 0.1)",
            border: "2px solid var(--success, #059669)",
            textAlign: "center",
            color: "var(--success, #059669)",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          You&apos;re subscribed
        </div>
      );
    }

    if (premiumStatus === "canceled") {
      return (
        <div
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: 9999,
            background: "rgba(217, 119, 6, 0.1)",
            border: "2px solid var(--warning, #d97706)",
            textAlign: "center",
            color: "var(--warning, #d97706)",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Cancels at period end
        </div>
      );
    }

    const isLoading = checkoutLoading !== null;

    return (
      <button
        onClick={() => handleCheckout("premium_annual", "premium_yearly")}
        disabled={isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "16px 24px",
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
          background: "#7c5cfc",
          borderRadius: 9999,
          border: "none",
          cursor: isLoading ? "wait" : "pointer",
          opacity: isLoading ? 0.7 : 1,
          boxShadow: "0 4px 16px rgba(124,92,252,0.25)",
        }}
      >
        {checkoutLoading === "premium_yearly" ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 1s linear infinite",
              }}
            />
            Processing...
          </>
        ) : (
          <>
            Get Started — $79/year
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </>
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
          <Link href="/bible" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            &larr; Home
          </Link>
          <h1 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
            Pricing
          </h1>
          <span className="w-[50px]" />
        </div>
      </header>

      <main style={{ flex: 1, padding: "48px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 700,
              color: "var(--foreground)",
              marginBottom: 12,
            }}
          >
            Simple, Transparent Pricing
          </h2>
          <p style={{ fontSize: 16, color: "var(--foreground-secondary)", maxWidth: 480, margin: "0 auto" }}>
            Read free forever. Upgrade for AI search, explanations, summaries, and audio.
          </p>
        </div>

        {error && (
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto 24px",
              padding: 12,
              borderRadius: 12,
              background: "#fef2f2",
              color: "var(--error)",
              textAlign: "center",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Outrank-style pricing card ── */}
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "var(--card, #fff)",
            borderRadius: 20,
            border: "1.5px dashed #c4b5fd",
            padding: "clamp(24px, 4vw, 48px)",
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(24px, 4vw, 48px)",
          }}
        >
          {/* Left side — plan name, price, CTA */}
          <div style={{ flex: "0 0 280px", minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <h3
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  margin: 0,
                }}
              >
                ClearBible Unlimited
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--foreground-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "3px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                All-in-one
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 56,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  lineHeight: 1,
                }}
              >
                $79
              </span>
              <span style={{ fontSize: 16, color: "var(--foreground-secondary)" }}>/year</span>
            </div>
            <p style={{ fontSize: 14, color: "var(--foreground-secondary)", marginBottom: 24 }}>
              or{" "}
              <button
                onClick={() => {
                  if (premiumStatus === "none" && !checkoutLoading) {
                    handleCheckout("premium_monthly", "premium_monthly");
                  }
                }}
                disabled={premiumStatus !== "none" || checkoutLoading !== null}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--accent)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: premiumStatus === "none" ? "pointer" : "default",
                  textDecoration: "underline",
                }}
              >
                {checkoutLoading === "premium_monthly" ? "Processing..." : "$9.99/month"}
              </button>
            </p>

            {renderCTAButton()}

            <p
              style={{
                fontSize: 13,
                color: "var(--foreground-secondary)",
                textAlign: "center",
                marginTop: 16,
              }}
            >
              <strong>Cancel anytime.</strong> No questions asked!
            </p>
          </div>

          {/* Right side — what's included */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h4
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: 20,
              }}
            >
              What&apos;s included:
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px 32px",
              }}
            >
              {FEATURES.map((item) => (
                <div key={item.bold} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" stroke="#7c5cfc" strokeWidth="1.5" />
                    <path d="m9 12 2 2 4-4" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--foreground)" }}>
                    <strong>{item.bold}</strong>{item.rest}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Free tier note */}
        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "var(--foreground-secondary)",
            maxWidth: 500,
            margin: "32px auto 0",
          }}
        >
          Bible text, bookmarks, notes, and reading progress are <strong>always free</strong>. No credit card required to start.
        </p>

        {/* Disclaimer */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            lineHeight: 1.7,
            color: "var(--foreground-secondary)",
            maxWidth: 500,
            margin: "24px auto 0",
          }}
        >
          All paid features are optional. <BrandName /> is an educational reading tool.
          AI-generated content describes what the biblical text contains without interpretation.
          See our{" "}
          <Link href="/refunds" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            Refund Policy
          </Link>{" "}
          for details on cancellations and refunds.
        </p>
      </main>

      <Footer />
    </div>
  );
}
