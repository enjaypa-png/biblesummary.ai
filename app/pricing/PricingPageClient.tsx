"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { startCheckout } from "@/lib/entitlements";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

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

          if (sub.type === "premium_yearly") {
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

  function renderButton(
    label: string,
    key: string,
    planStatus: PlanStatus,
    onClick: () => void,
    isPrimary: boolean
  ) {
    if (planStatus === "active") {
      return (
        <button
          disabled
          className={isPrimary ? "btn-primary" : "btn-secondary"}
          style={{ width: "100%", justifyContent: "center", opacity: 0.6, cursor: "default" }}
        >
          Active
        </button>
      );
    }

    if (planStatus === "canceled") {
      return (
        <button
          disabled
          className="btn-secondary"
          style={{ width: "100%", justifyContent: "center", opacity: 0.7, cursor: "default", color: "#d97706", borderColor: "#d97706" }}
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
        className={isPrimary ? "btn-primary" : "btn-secondary"}
        style={{ width: "100%", justifyContent: "center", opacity: isLoading ? 0.6 : 1 }}
      >
        {isLoading ? "Processing..." : label}
      </button>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#2a2520", background: "#fff", paddingBottom: 0 }}>
      <MarketingNav />

      {/* Hero */}
      <section
        className="marketing-section hero-gradient"
        style={{ textAlign: "center" }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#7C5CFC", marginBottom: 16 }}>
            Pricing
          </p>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.15, color: "#1a1510", marginBottom: 24 }}>
            Simple, <span className="gradient-text">transparent</span> pricing
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#4a4540" }}>
            Read free forever. Upgrade for AI explanations, summaries, and audio.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="marketing-section" style={{ background: "#faf9f7" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {error && (
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                borderRadius: 12,
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 80 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid #e8e5e0",
                  borderTopColor: "#7C5CFC",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 24,
              }}
            >
              {/* Free Plan */}
              <div className="pricing-card">
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#22a867",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 16,
                  }}
                >
                  Free Plan
                </div>
                <div style={{ fontSize: 56, fontWeight: 800, color: "#1a1510", marginBottom: 4 }}>
                  $0
                </div>
                <p style={{ fontSize: 15, color: "#6a655e", marginBottom: 40 }}>
                  Free forever. No credit card required.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    "Read the Bible (KJV + Clear Bible Translation)",
                    "Personal notes on any verse",
                    "Highlights in 5 colors",
                    "Bookmarks & reading progress",
                    "Search across the entire Bible",
                  ].map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: "#3a3530" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22a867" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="btn-secondary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Get Started Free
                </Link>
              </div>

              {/* Premium Plan */}
              <div className="pricing-card featured">
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #7C5CFC 0%, #5A3BFF 100%)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 20px",
                    borderRadius: 999,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Recommended
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#7C5CFC",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 16,
                  }}
                >
                  Premium Plan
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 56, fontWeight: 800, color: "#1a1510" }}>$79</span>
                  <span style={{ fontSize: 18, color: "#6a655e" }}>/year</span>
                </div>
                <p style={{ fontSize: 15, color: "#6a655e", marginBottom: 8 }}>
                  or $9.99/month
                </p>
                <p style={{ fontSize: 13, color: "#b0a89e", marginBottom: 40 }}>
                  Cancel anytime. No questions asked.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    "Everything in Free",
                    "AI Bible Search — instant answers with verses",
                    "Unlimited AI verse explanations",
                    "All 66 book summaries",
                    "Audio narration for every chapter",
                    "Summary audio playback",
                    "All future AI features included",
                    "Priority feature updates",
                  ].map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: "#3a3530" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {renderButton(
                    "Upgrade — $79/year",
                    "premium_annual",
                    premiumStatus,
                    () => handleCheckout("premium_annual", "premium_annual"),
                    true
                  )}
                  {premiumStatus === "none" && (
                    renderButton(
                      "or $9.99/month",
                      "premium_monthly",
                      premiumStatus,
                      () => handleCheckout("premium_monthly", "premium_monthly"),
                      false
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              lineHeight: 1.7,
              color: "#b0a89e",
              marginTop: 48,
              maxWidth: 600,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            All paid features are optional. ClearBible.ai is an educational reading tool.
            AI-generated content describes what the biblical text contains without interpretation.
            See our{" "}
            <Link href="/refunds" style={{ color: "#7C5CFC", textDecoration: "underline" }}>
              Refund Policy
            </Link>{" "}
            for details.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="marketing-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#7C5CFC", marginBottom: 16 }}>
              FAQ
            </p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1510" }}>
              Have questions?
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                q: "Is the Bible text really free?",
                a: "Yes. Reading the Bible in both KJV and Clear Bible Translation is 100% free and always will be. Notes, highlights, and bookmarks are also free.",
              },
              {
                q: "What does Premium include?",
                a: "Premium includes AI Bible Search, unlimited verse explanations, all 66 book summaries, audio narration for every chapter, and all future AI features.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel anytime from your account settings. You'll keep access until the end of your current billing period.",
              },
              {
                q: "Is there a refund policy?",
                a: "Yes. We offer refunds within the first 7 days of your subscription. See our Refund Policy for full details.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                style={{
                  padding: "24px 28px",
                  borderRadius: 16,
                  border: "1px solid #e8e5e0",
                  background: "#fff",
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1510", marginBottom: 8 }}>
                  {faq.q}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "#4a4540", margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="marketing-section hero-gradient-light"
        style={{ textAlign: "center" }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1510", marginBottom: 20 }}>
            Start reading with clarity today.
          </h2>
          <Link href="/signup" className="btn-primary" style={{ fontSize: 16, padding: "16px 40px" }}>
            Start Reading Free
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
