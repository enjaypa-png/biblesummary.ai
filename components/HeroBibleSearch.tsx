"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import AISearchInput, { AISearchInputRef } from "@/components/AISearchInput";
import AISearchLoading from "@/components/AISearchLoading";
import AISearchResponseCard from "@/components/AISearchResponseCard";
import { DEMO_QUESTIONS, matchDemoQuestion, type DemoAnswer } from "@/data/demo-search";

const STATS = [
  { label: "Verses", value: "31,102" },
  { label: "Books", value: "66" },
  { label: "Chapters", value: "1,189" },
];

export default function HeroBibleSearch() {
  const [inputValue, setInputValue] = useState("");
  const [demoResult, setDemoResult] = useState<DemoAnswer | null>(null);
  const [showSignupCta, setShowSignupCta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState("");
  const searchRef = useRef<AISearchInputRef>(null);

  function handleSubmit() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setActiveQuestion(trimmed);
    setDemoResult(null);
    setShowSignupCta(false);

    const match = matchDemoQuestion(trimmed);
    if (match) {
      // Simulate brief loading for polish
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setDemoResult(match);
      }, 1200);
    } else {
      // Not a demo question — show signup CTA
      setShowSignupCta(true);
    }
  }

  function handleChipClick(question: string) {
    setInputValue(question);
    setDemoResult(null);
    setShowSignupCta(false);
    setActiveQuestion(question);

    const match = matchDemoQuestion(question);
    if (match) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setDemoResult(match);
      }, 1200);
    }
  }

  function handleDismiss() {
    setDemoResult(null);
    setShowSignupCta(false);
    setLoading(false);
    setActiveQuestion("");
  }

  return (
    <>
      <style>{`
        @keyframes floatChip0 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatChip1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatChip2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-search-layout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
        }
        .hero-search-center {
          flex: 0 1 640px;
          min-width: 0;
          text-align: left;
        }
        .hero-search-side {
          flex: 0 0 180px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hero-search-side-left {
          align-items: flex-end;
          padding-top: 10px;
        }
        .hero-search-side-right {
          align-items: flex-start;
          padding-top: 10px;
        }
        .hero-suggestion-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(124, 92, 252, 0.15);
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          color: #5a4a8a;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
        .hero-suggestion-chip:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(124, 92, 252, 0.4);
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 16px rgba(124, 92, 252, 0.15);
        }
        .hero-stats-card {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(124, 92, 252, 0.12);
          border-radius: 20px;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 160px;
        }
        .hero-stats-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #7c5cfc;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
        .hero-stat-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .hero-stat-value {
          font-size: 20px;
          font-weight: 800;
          color: #1a1528;
          letter-spacing: -0.02em;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
        .hero-stat-label {
          font-size: 12px;
          font-weight: 500;
          color: #8a8a9a;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
        .hero-search-container {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(124, 92, 252, 0.1);
          border-radius: 28px;
          padding: 20px 24px;
        }
        .hero-search-subtitle {
          margin-top: 10px;
          font-size: 13px;
          color: #8a85a0;
          font-family: 'Inter', 'DM Sans', sans-serif;
          text-align: center;
        }
        @media (max-width: 900px) {
          .hero-search-side {
            display: none !important;
          }
          .hero-search-layout {
            gap: 0;
          }
        }
      `}</style>

      <div className="hero-search-layout">
        {/* Left side: floating suggestion chips */}
        <div className="hero-search-side hero-search-side-left">
          {DEMO_QUESTIONS.map((demo, i) => (
            <button
              key={demo.question}
              type="button"
              className="hero-suggestion-chip"
              style={{
                animation: `floatChip${i} ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
              onClick={() => handleChipClick(demo.question)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              {demo.question}
            </button>
          ))}
        </div>

        {/* Center: search bar + results */}
        <div className="hero-search-center">
          <div className="hero-search-container">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginBottom: 14,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "#9b82fc",
                fontFamily: "'Inter', 'DM Sans', sans-serif",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#9b82fc">
                <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
              </svg>
              AI-Powered Bible Search
            </div>

            <AISearchInput
              ref={searchRef}
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              loading={loading}
            />

            <div className="hero-search-subtitle">
              Get instant Bible answers with supporting verses.
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ marginTop: 16 }}>
              <AISearchLoading />
            </div>
          )}

          {/* Demo answer with blur preview */}
          {demoResult && !loading && (
            <div style={{ marginTop: 16 }}>
              <AISearchResponseCard
                question={demoResult.question}
                answer={demoResult.preview}
                verses={[]}
                blurred
                onDismiss={handleDismiss}
                blurCta={
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#1a1528",
                        margin: "0 0 6px",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Create a free account to read the full explanation
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#6b6580",
                        margin: "0 0 16px",
                        fontFamily: "'DM Sans', sans-serif",
                        lineHeight: 1.5,
                      }}
                    >
                      Get full answers, supporting verses, and AI-powered Bible search.
                    </p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      <Link
                        href="/signup"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "12px 28px",
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: "'DM Sans', sans-serif",
                          color: "#fff",
                          background: "linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%)",
                          borderRadius: 50,
                          textDecoration: "none",
                          boxShadow: "0 4px 16px rgba(124,92,252,0.3)",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
                        </svg>
                        Create Free Account
                      </Link>
                      <Link
                        href="/login"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "12px 22px",
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                          color: "#7c5cfc",
                          background: "rgba(124, 92, 252, 0.06)",
                          border: "1px solid rgba(124, 92, 252, 0.2)",
                          borderRadius: 50,
                          textDecoration: "none",
                        }}
                      >
                        Log in
                      </Link>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#9b95a8",
                        marginTop: 12,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      No credit card required
                    </p>
                  </div>
                }
              />
            </div>
          )}

          {/* Non-demo question signup CTA */}
          {showSignupCta && !loading && (
            <div style={{ marginTop: 16, animation: "slideDown 0.35s ease" }}>
              <div
                style={{
                  padding: "24px 28px",
                  background: "linear-gradient(135deg, #f8f6ff 0%, #f0edff 100%)",
                  borderRadius: 18,
                  border: "1px solid rgba(124, 92, 252, 0.15)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 16px",
                    background: "rgba(124, 92, 252, 0.08)",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#7c5cfc",
                    fontFamily: "'DM Sans', sans-serif",
                    marginBottom: 16,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  &ldquo;{activeQuestion}&rdquo;
                </div>

                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1a1528",
                    margin: "0 0 6px",
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.4,
                  }}
                >
                  Sign up free to ask your own Bible questions
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "#6b6580",
                    margin: "0 0 20px",
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  AI Bible Search finds answers and supporting verses instantly.
                  <br />
                  Create a free account to start asking.
                </p>

                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link
                    href="/signup"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "13px 32px",
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif",
                      color: "#fff",
                      background: "linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%)",
                      borderRadius: 50,
                      textDecoration: "none",
                      boxShadow: "0 4px 16px rgba(124,92,252,0.3)",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
                    </svg>
                    Create Free Account
                  </Link>
                  <Link
                    href="/login"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "13px 24px",
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      color: "#7c5cfc",
                      background: "rgba(124, 92, 252, 0.06)",
                      border: "1px solid rgba(124, 92, 252, 0.2)",
                      borderRadius: 50,
                      textDecoration: "none",
                      transition: "all 0.25s ease",
                    }}
                  >
                    Log in
                  </Link>
                </div>

                <p
                  style={{
                    fontSize: 12,
                    color: "#9b95a8",
                    marginTop: 14,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  No credit card required
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right side: Quick Stats card */}
        <div className="hero-search-side hero-search-side-right">
          <div className="hero-stats-card">
            <div className="hero-stats-title">The Bible</div>
            {STATS.map((stat) => (
              <div key={stat.label} className="hero-stat-row">
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
