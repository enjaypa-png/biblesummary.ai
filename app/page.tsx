"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

/* ═══════════════════ DEMO COMPONENTS ═══════════════════ */

const DEMO_VERSE_TEXT =
  "For the love of money is the root of all evil: which while some coveted after, they have erred from the faith, and pierced themselves through with many sorrows.";

const DEMO_EXPLANATION =
  "Most people quote this as \u2018money is the root of all evil\u2019 \u2014 but that\u2019s not what it says. It\u2019s the love of money that Paul is warning about, not money itself. He\u2019s describing what happens when the desire to get rich becomes your main focus: you start making compromises and drifting from what actually matters.";

function VerseDemo() {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 8px 40px rgba(30,40,80,0.10), 0 1.5px 4px rgba(30,40,80,0.06)",
          overflow: "hidden",
          border: "1px solid #e8e5e0",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            background: "#f8f7f5",
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e8e5e0",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <span style={{ fontSize: 13, color: "#6a655e", fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>
            1 Timothy 6
          </span>
        </div>

        {/* Verse */}
        <div style={{ padding: "28px 24px 20px" }}>
          <p
            onClick={() => setShowExplanation(!showExplanation)}
            style={{
              fontSize: 17,
              lineHeight: 1.85,
              color: "#3a3530",
              margin: 0,
              padding: "8px 12px",
              borderRadius: 10,
              background: showExplanation ? "#f0edff" : "transparent",
              cursor: "pointer",
              transition: "background 0.25s ease",
              border: showExplanation ? "1.5px solid #c4b8ff" : "1.5px solid transparent",
              fontFamily: "'Source Serif 4', Georgia, serif",
            }}
          >
            <span style={{ color: "#7c5cfc", fontWeight: 700, fontSize: 13, marginRight: 6, fontFamily: "'Inter', sans-serif" }}>10</span>
            {DEMO_VERSE_TEXT}
            {!showExplanation && (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: 8,
                  fontSize: 11,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: "#7c5cfc",
                  background: "#f0edff",
                  padding: "2px 10px",
                  borderRadius: 20,
                  cursor: "pointer",
                  animation: "pulse-badge 2s ease-in-out infinite",
                  verticalAlign: "middle",
                }}
              >
                tap to explain
              </span>
            )}
          </p>

          {showExplanation && (
            <div
              style={{
                marginTop: 12,
                padding: "18px 20px",
                background: "linear-gradient(135deg, #f8f6ff 0%, #f0edff 100%)",
                borderRadius: 12,
                borderLeft: "3px solid #7c5cfc",
                animation: "slideDown 0.35s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#7c5cfc",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Plain-Language Explanation
                </span>
              </div>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: "#4a4550",
                  margin: 0,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {DEMO_EXPLANATION}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function ClearBibleLanding() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        router.replace("/bible");
      } else {
        setReady(true);
      }
    });
  }, [router]);

  if (!ready) return null;

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#2a2520",
        background: "#fff",
        minHeight: "100vh",
        overflowX: "hidden",
        paddingBottom: 0,
      }}
    >
      <MarketingNav />

      {/* ═══════════ SECTION 1 — HERO ═══════════ */}
      <section
        className="hero-gradient"
        style={{
          padding: "120px 24px 120px",
        }}
      >

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
          }}
        >
          {/* Left: text */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              className="fade-up"
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7C5CFC",
                marginBottom: 20,
              }}
            >
              Bible Reading Companion
            </p>
            <h1
              className="fade-up fade-up-delay-1"
              style={{
                fontSize: "clamp(40px, 5vw, 64px)",
                fontWeight: 800,
                lineHeight: 1.1,
                color: "#1a1510",
                marginBottom: 24,
              }}
            >
              <span className="gradient-text">Understand.</span>
              <br />
              <span className="gradient-text">Remember.</span>
              <br />
              <span className="gradient-text">Apply.</span>
            </h1>
            <p
              className="fade-up fade-up-delay-2"
              style={{
                fontSize: 18,
                lineHeight: 1.7,
                color: "#4a4540",
                marginBottom: 16,
                maxWidth: 480,
              }}
            >
              ClearBible helps you understand scripture so you actually remember what you read and can apply it to your life.
            </p>
            <p
              className="fade-up fade-up-delay-2"
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "#6a655e",
                marginBottom: 36,
                maxWidth: 480,
              }}
            >
              Many people read the Bible but only remember bits and pieces. ClearBible uses clear explanations, summaries, and AI search so the message stays with you long after you finish reading.
            </p>
            <div className="fade-up fade-up-delay-3" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/signup" className="btn-primary" style={{ fontSize: 16, padding: "16px 36px" }}>
                Start Reading Free
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <Link href="/features" className="btn-secondary" style={{ fontSize: 16, padding: "16px 36px" }}>
                Ask the Bible AI
              </Link>
            </div>
            <p className="fade-up fade-up-delay-4" style={{ fontSize: 13, color: "#b0a89e", marginTop: 20 }}>
              No credit card required
            </p>
          </div>

          {/* Right: demo */}
          <div className="fade-up fade-up-delay-2 hidden md:block">
            <VerseDemo />
          </div>
        </div>

        {/* Mobile demo below */}
        <div className="md:hidden fade-up fade-up-delay-3" style={{ marginTop: 60, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
          <VerseDemo />
        </div>
      </section>

      {/* ═══════════ SECTION 2 — CORE MESSAGE ═══════════ */}
      <section className="marketing-section" style={{ background: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(30px, 4.5vw, 48px)",
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#1a1510",
              marginBottom: 24,
            }}
          >
            Reading the Bible is powerful.{" "}
            <span className="gradient-text">Understanding it changes everything.</span>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.8, color: "#4a4540", maxWidth: 600, margin: "0 auto" }}>
            When you understand scripture, you remember it. When you remember it, you can apply it to your life.
            ClearBible helps readers move beyond simply reading the Bible to truly understanding it.
          </p>
        </div>
      </section>

      {/* ═══════════ SECTION 3 — UNDERSTAND / REMEMBER / APPLY ═══════════ */}
      <section className="marketing-section" style={{ background: "#faf9f7" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7C5CFC",
                marginBottom: 16,
              }}
            >
              The ClearBible Framework
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                color: "#1a1510",
              }}
            >
              Three steps to <span className="gradient-text">deeper understanding</span>
            </h2>
          </div>

          <div className="marketing-grid-3">
            {[
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                ),
                title: "Understand",
                desc: "Clear explanations make difficult verses easy to grasp. Tap any verse and instantly see what it means in plain language.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                ),
                title: "Remember",
                desc: "Summaries help the message stay with you. After every chapter, a clear summary reinforces what you just read.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                ),
                title: "Apply",
                desc: "Ask questions and connect scripture to real life. AI-powered search helps you find answers supported by actual verses.",
              },
            ].map((item) => (
              <div key={item.title} className="marketing-card" style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: "#f5f2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                  }}
                >
                  {item.icon}
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1a1510", marginBottom: 12 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "#6a655e" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 4 — FEATURE ROWS ═══════════ */}
      <section className="marketing-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7C5CFC",
                marginBottom: 16,
              }}
            >
              Features
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                color: "#1a1510",
              }}
            >
              Everything you need to <span className="gradient-text">study scripture</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 120 }}>
            {[
              {
                title: "AI Bible Search",
                desc: "Ask any question and see answers supported by scripture. No more flipping through pages or searching the internet. Get instant, verse-backed answers.",
                emoji: "🔍",
                reverse: false,
              },
              {
                title: "Verse Explanations",
                desc: "Tap any verse to instantly understand its meaning. Get clear, plain-language explanations without theological jargon or complex commentary.",
                emoji: "✨",
                reverse: true,
              },
              {
                title: "Book Summaries",
                desc: "Quickly understand entire chapters and books. Every summary has been audited for accuracy so you can trust what you read.",
                emoji: "📋",
                reverse: false,
              },
              {
                title: "Audio Narration",
                desc: "Listen while driving, walking, or studying. Every chapter comes with high-quality audio narration so you can take scripture with you anywhere.",
                emoji: "🎧",
                reverse: true,
              },
              {
                title: "Notes, Highlights & Bookmarks",
                desc: "Capture insights while you read. Mark meaningful passages, write notes directly on verses, and bookmark your place to pick up where you left off.",
                emoji: "📝",
                reverse: false,
              },
              {
                title: "Multiple Translations",
                desc: "Switch between KJV, WEB, and the Clear Bible Translation. Compare the timeless King James language with a modern, plain-English rendering.",
                emoji: "📖",
                reverse: true,
              },
            ].map((feature, i) => (
              <div key={feature.title} className={`feature-row ${feature.reverse ? "reverse" : ""}`}>
                <div className="feature-image-placeholder">
                  <span style={{ fontSize: 64 }}>{feature.emoji}</span>
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "clamp(24px, 3vw, 32px)",
                      fontWeight: 800,
                      color: "#1a1510",
                      marginBottom: 16,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: "#4a4540", marginBottom: 24 }}>
                    {feature.desc}
                  </p>
                  <Link
                    href="/features"
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#7C5CFC",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Learn more
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 5 — TRUST STATEMENT ═══════════ */}
      <section
        className="marketing-section purple-gradient-bg"
        style={{ textAlign: "center" }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 24,
            }}
          >
            Built for clarity and accuracy.
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.8, color: "rgba(255,255,255,0.85)", maxWidth: 600, margin: "0 auto" }}>
            Every ClearBible summary has been audited hundreds of times to ensure the meaning and most important details are faithfully captured. We take accuracy seriously.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 48,
              marginTop: 60,
              flexWrap: "wrap",
            }}
          >
            {[
              { num: "66", label: "Books" },
              { num: "1,189", label: "Chapters" },
              { num: "31,000+", label: "Verses" },
              { num: "100%", label: "Free to Read" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{stat.num}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 6 — FREE BIBLE TOOLS ═══════════ */}
      <section className="marketing-section" style={{ background: "#faf9f7" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7C5CFC",
                marginBottom: 16,
              }}
            >
              Free Resources
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                color: "#1a1510",
              }}
            >
              Free Bible Tools
            </h2>
          </div>

          <div className="marketing-grid-3">
            {[
              { name: "Bible Verse Generator", desc: "Generate random Bible verses for inspiration and study.", slug: "bible-verse-generator" },
              { name: "Bible Reading Time Calculator", desc: "Find out how long it takes to read any book of the Bible.", slug: "bible-reading-time-calculator" },
              { name: "Bible Character Lookup", desc: "Learn about key people in the Bible and their stories.", slug: "bible-character-lookup" },
              { name: "Sermon Outline Generator", desc: "Get a structured outline for any Bible passage.", slug: "sermon-outline-generator" },
              { name: "Verse Explanation Tool", desc: "Get plain-language explanations for any verse.", slug: "verse-explanation-tool" },
            ].map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="marketing-card"
                style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#f5f2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1510", marginBottom: 8 }}>
                  {tool.name}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#6a655e", margin: 0 }}>
                  {tool.desc}
                </p>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link
              href="/tools"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#7C5CFC",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              View all tools
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 7 — PRICING PREVIEW ═══════════ */}
      <section className="marketing-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7C5CFC",
                marginBottom: 16,
              }}
            >
              Pricing
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                color: "#1a1510",
              }}
            >
              Simple, transparent pricing
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 24,
            }}
          >
            {/* Free */}
            <div className="pricing-card">
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#22a867",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 12,
                }}
              >
                Free
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#1a1510", marginBottom: 4 }}>
                $0
              </div>
              <p style={{ fontSize: 14, color: "#6a655e", marginBottom: 32 }}>Free forever</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 14 }}>
                {["Read the Bible (KJV + Clear Bible Translation)", "Notes on any verse", "Highlights (5 colors)", "Bookmarks & reading progress"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#3a3530" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22a867" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="btn-secondary"
                style={{ width: "100%", justifyContent: "center", padding: "14px 24px" }}
              >
                Get Started Free
              </Link>
            </div>

            {/* Premium */}
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
                  marginBottom: 12,
                }}
              >
                Premium
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: "#1a1510" }}>$79</span>
                <span style={{ fontSize: 16, color: "#6a655e" }}>/year</span>
              </div>
              <p style={{ fontSize: 14, color: "#6a655e", marginBottom: 32 }}>or $9.99/month</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  "Everything in Free",
                  "AI verse explanations",
                  "All 66 book summaries",
                  "AI Bible search",
                  "Audio narration for every chapter",
                  "All future features",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#3a3530" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "14px 24px" }}
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 8 — FINAL CTA ═══════════ */}
      <section
        className="marketing-section hero-gradient-light"
        style={{
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(30px, 4.5vw, 48px)",
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#1a1510",
              marginBottom: 20,
            }}
          >
            The Bible becomes powerful when you{" "}
            <span className="gradient-text">understand it.</span>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#4a4540", marginBottom: 40 }}>
            Start reading with ClearBible today and experience scripture in a clearer way.
          </p>
          <Link href="/signup" className="btn-primary" style={{ fontSize: 18, padding: "18px 48px" }}>
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
