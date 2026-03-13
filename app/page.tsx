"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase";
import HeroBibleSearch from "@/components/HeroBibleSearch";
import BrandName from "@/components/BrandName";
import Logo from "@/components/Logo";

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
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      color: "#2a2520",
      background: "#faf9f7",
      minHeight: "100vh",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-badge {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .feature-block {
          background: #fff;
          border-radius: 20px;
          padding: 48px 40px;
          box-shadow: 0 2px 20px rgba(30, 40, 80, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.03);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .feature-block:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(30, 40, 80, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.03);
        }
        .feature-visual {
          background: linear-gradient(135deg, #f8f6ff 0%, #f0edff 100%);
          border-radius: 14px;
          border: 1px solid #e8e2ff;
          padding: 28px 24px;
          margin-top: 28px;
        }

        @media (max-width: 768px) {
          .feature-grid {
            grid-template-columns: 1fr !important;
          }
          .feature-block {
            padding: 32px 24px;
          }
          .feature-visual {
            padding: 20px 16px;
          }
          .hero-headline {
            font-size: 48px !important;
          }
          .feature-section-headline {
            font-size: 32px !important;
          }
        }

        @media (max-width: 480px) {
          .hero-headline {
            font-size: 36px !important;
          }
          .feature-section-headline {
            font-size: 26px !important;
          }
        }
      `}</style>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section style={{
        position: "relative",
        padding: "80px 24px 72px",
        textAlign: "center",
        background: "radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f4f1ff 30%, #e7e2ff 55%, #d6ccff 80%, #c4b8ff 100%)",
        overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto" }}>
          {/* Logo */}
          <div style={{ margin: "0 auto 36px", animation: "fadeUp 0.5s ease both", textAlign: "center" }}>
            <Logo height={1000} style={{ display: "inline-block" }} />
          </div>

          {/* Main headline: UNDERSTAND · REMEMBER · APPLY */}
          <h1
            className="hero-headline"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 24,
              animation: "fadeUp 0.7s ease both",
              letterSpacing: "-1px",
            }}
          >
            <span style={{ color: "#1a1510" }}>UNDERSTAND</span>
            <span style={{ color: "#b0a89e", margin: "0 16px", fontWeight: 400 }}>&middot;</span>
            <span style={{ color: "#1a1510" }}>REMEMBER</span>
            <span style={{ color: "#b0a89e", margin: "0 16px", fontWeight: 400 }}>&middot;</span>
            <span style={{ color: "#7c5cfc" }}>APPLY</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 18,
            lineHeight: 1.65,
            color: "#5a554e",
            maxWidth: 600,
            margin: "0 auto 40px",
            animation: "fadeUp 0.7s ease 0.15s both",
          }}>
            Read Clear Bible Translation (CBT), King James Version (KJV), or World English Bible (WEB)
          </p>

          {/* AI Search Bar */}
          <div style={{ animation: "fadeUp 0.7s ease 0.25s both" }}>
            <HeroBibleSearch />
          </div>

          {/* CTA Buttons */}
          <div style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            animation: "fadeUp 0.7s ease 0.35s both",
          }}>
            <Link href="/signup" style={{
              display: "inline-block",
              padding: "16px 40px",
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              background: "#7c5cfc",
              borderRadius: 12,
              textDecoration: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 4px 16px rgba(124,92,252,0.3)",
            }}>
              Create Free Account
            </Link>
            <Link href="/login" style={{
              display: "inline-block",
              padding: "16px 40px",
              fontSize: 16,
              fontWeight: 700,
              color: "#7c5cfc",
              background: "#fff",
              border: "2px solid #7c5cfc",
              borderRadius: 12,
              textDecoration: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
            }}>
              Sign In
            </Link>
          </div>

          <p style={{
            fontSize: 13,
            color: "#9a958e",
            marginTop: 16,
            animation: "fadeUp 0.7s ease 0.4s both",
          }}>
            No credit card required
          </p>
        </div>
      </section>

      {/* ═══════════════════ FEATURE SECTION ═══════════════════ */}
      <section style={{
        padding: "100px 24px",
        background: "#faf9f7",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <h2
              className="feature-section-headline"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#1a1510",
                marginBottom: 20,
              }}
            >
              Understand the Bible. Remember it.{" "}
              <span style={{ color: "#7c5cfc" }}>Apply it.</span>
            </h2>
            <p style={{
              fontSize: 18,
              lineHeight: 1.65,
              color: "#6a655e",
              maxWidth: 560,
              margin: "0 auto",
            }}>
              AI tools that help you understand scripture clearly and retain what you read.
            </p>
          </div>

          {/* Feature Grid */}
          <div
            className="feature-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 28,
            }}
          >
            {/* FEATURE 1 — AI Bible Search */}
            <div className="feature-block">
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7c5cfc",
                marginBottom: 16,
              }}>
                AI-Powered
              </div>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#1a1510",
                marginBottom: 14,
              }}>
                Ask the Bible Anything
              </h3>
              <p style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "#5a554e",
                marginBottom: 0,
              }}>
                Ask any Bible question and receive an instant AI-powered answer with supporting verses.
              </p>

              {/* Visual: Mock search bar with example questions */}
              <div className="feature-visual">
                {/* Search bar mock */}
                <div style={{
                  background: "#fff",
                  borderRadius: 999,
                  border: "1.5px solid #d9d0ff",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span style={{ fontSize: 14, color: "#9a958f", fontFamily: "'DM Sans', sans-serif" }}>
                    Ask a Bible question...
                  </span>
                </div>

                {/* Example questions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["Who was Samson?", "Why did Judas betray Jesus?", "What does the Bible say about anxiety?"].map((q) => (
                    <div key={q} style={{
                      background: "#fff",
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontSize: 14,
                      color: "#3a3530",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid #ede8ff",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FEATURE 2 — Instant Verse Explanation */}
            <div className="feature-block">
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7c5cfc",
                marginBottom: 16,
              }}>
                Instant Clarity
              </div>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#1a1510",
                marginBottom: 14,
              }}>
                Instant Verse Explanation
              </h3>
              <p style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "#5a554e",
                marginBottom: 0,
              }}>
                Tap any verse and instantly see a clear, modern explanation that helps you understand the meaning without theological jargon.
              </p>

              {/* Visual: Verse with explanation panel */}
              <div className="feature-visual">
                {/* Verse block */}
                <div style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "16px 18px",
                  marginBottom: 14,
                  border: "1.5px solid #c4b8ff",
                }}>
                  <span style={{
                    color: "#9a958e",
                    fontWeight: 700,
                    fontSize: 12,
                    marginRight: 6,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>10</span>
                  <span style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "#3a3530",
                    fontFamily: "'Source Serif 4', Georgia, serif",
                  }}>
                    For the love of money is the root of all evil: which while some coveted after, they have erred from the faith...
                  </span>
                </div>

                {/* Explanation panel */}
                <div style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "16px 18px",
                  borderLeft: "3px solid #7c5cfc",
                }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#7c5cfc",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    marginBottom: 8,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Plain-Language Explanation
                  </div>
                  <p style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: "#4a4550",
                    margin: 0,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Most people quote this as &ldquo;money is the root of all evil&rdquo; &mdash; but that&rsquo;s not what it says. It&rsquo;s the love of money that Paul is warning about...
                  </p>
                </div>
              </div>
            </div>

            {/* FEATURE 3 — Apply Feature */}
            <div className="feature-block">
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7c5cfc",
                marginBottom: 16,
              }}>
                Take Action
              </div>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#1a1510",
                marginBottom: 14,
              }}>
                Apply What You Read
              </h3>
              <p style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "#5a554e",
                marginBottom: 0,
              }}>
                ClearBible helps you move beyond reading and into action by showing practical insights drawn from scripture so you can apply what you learn in daily life.
              </p>

              {/* Visual: Understand → Remember → Apply flow */}
              <div className="feature-visual">
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}>
                  {/* Step 1 */}
                  <div style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "16px 20px",
                    textAlign: "center",
                    border: "1px solid #ede8ff",
                    flex: "1 1 100px",
                    minWidth: 100,
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#f0edff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1510", fontFamily: "'DM Sans', sans-serif" }}>Understand</div>
                    <div style={{ fontSize: 11, color: "#8a8580", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Read & learn</div>
                  </div>

                  {/* Arrow */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4b8ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>

                  {/* Step 2 */}
                  <div style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "16px 20px",
                    textAlign: "center",
                    border: "1px solid #ede8ff",
                    flex: "1 1 100px",
                    minWidth: 100,
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#f0edff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1510", fontFamily: "'DM Sans', sans-serif" }}>Remember</div>
                    <div style={{ fontSize: 11, color: "#8a8580", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Retain meaning</div>
                  </div>

                  {/* Arrow */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4b8ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>

                  {/* Step 3 */}
                  <div style={{
                    background: "#7c5cfc",
                    borderRadius: 12,
                    padding: "16px 20px",
                    textAlign: "center",
                    border: "1px solid #7c5cfc",
                    flex: "1 1 100px",
                    minWidth: 100,
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>Apply</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Live it out</div>
                  </div>
                </div>

                {/* Practical insight card */}
                <div style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "16px 18px",
                  marginTop: 18,
                  borderLeft: "3px solid #7c5cfc",
                }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#7c5cfc",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    marginBottom: 6,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Practical Insight
                  </div>
                  <p style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: "#4a4550",
                    margin: 0,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    This week, notice when the desire for more starts to drive your decisions. Contentment isn&rsquo;t settling &mdash; it&rsquo;s choosing what matters most.
                  </p>
                </div>
              </div>
            </div>

            {/* FEATURE 4 — Chapter Summaries */}
            <div className="feature-block">
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7c5cfc",
                marginBottom: 16,
              }}>
                Retention
              </div>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#1a1510",
                marginBottom: 14,
              }}>
                Chapter Summaries
              </h3>
              <p style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "#5a554e",
                marginBottom: 0,
              }}>
                After reading a chapter, receive a concise summary that reinforces the message so the meaning sticks.
              </p>

              {/* Visual: Chapter panel with summary card */}
              <div className="feature-visual">
                {/* Chapter header mock */}
                <div style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid #ede8ff",
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8580", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
                      1 Timothy 6
                    </div>
                    <div style={{ fontSize: 13, color: "#3a3530", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                      25 verses
                    </div>
                  </div>
                  <div style={{
                    background: "#7c5cfc",
                    color: "#fff",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    View Summary
                  </div>
                </div>

                {/* Summary card */}
                <div style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "16px 18px",
                  borderLeft: "3px solid #7c5cfc",
                }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#7c5cfc",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    marginBottom: 10,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Chapter Summary
                  </div>
                  <ul style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: "#4a4550",
                    margin: 0,
                    paddingLeft: 16,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    <li style={{ marginBottom: 6 }}>Paul instructs Timothy on how servants should treat their masters.</li>
                    <li style={{ marginBottom: 6 }}>He warns against false teachers who use religion as a way to get rich.</li>
                    <li>He describes contentment as &ldquo;great gain.&rdquo;</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FEATURE 5 — Study Tools (Full width) */}
            <div className="feature-block" style={{ gridColumn: "1 / -1" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 40,
                alignItems: "center",
              }}>
                <div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: "#7c5cfc",
                    marginBottom: 16,
                  }}>
                    Study Tools
                  </div>
                  <h3 style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#1a1510",
                    marginBottom: 14,
                  }}>
                    Remember What You Read
                  </h3>
                  <p style={{
                    fontSize: 16,
                    lineHeight: 1.7,
                    color: "#5a554e",
                    marginBottom: 0,
                  }}>
                    Highlight important passages, write notes, and bookmark exactly where you left off.
                  </p>
                </div>

                {/* Visual: Highlights, notes, bookmarks UI elements */}
                <div className="feature-visual" style={{ marginTop: 0 }}>
                  {/* Highlight mock */}
                  <div style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 12,
                    border: "1px solid #ede8ff",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"].map((c) => (
                          <div key={c} style={{ width: 16, height: 16, borderRadius: "50%", background: c, border: "1px solid rgba(0,0,0,0.08)" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: "#8a8580", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                        5 highlight colors
                      </span>
                    </div>
                    <p style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "#3a3530",
                      margin: 0,
                      fontFamily: "'Source Serif 4', Georgia, serif",
                      background: "linear-gradient(to bottom, #fef08a66, #fef08a66)",
                      padding: "2px 4px",
                      borderRadius: 4,
                    }}>
                      The LORD is my shepherd; I shall not want.
                    </p>
                  </div>

                  {/* Note mock */}
                  <div style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 12,
                    border: "1px solid #ede8ff",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span style={{ fontSize: 11, color: "#8a8580", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                        Personal Note
                      </span>
                    </div>
                    <p style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "#4a4550",
                      margin: 0,
                      fontFamily: "'DM Sans', sans-serif",
                      fontStyle: "italic",
                    }}>
                      &ldquo;This reminds me to trust God in seasons of uncertainty...&rdquo;
                    </p>
                  </div>

                  {/* Bookmark mock */}
                  <div style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: "14px 16px",
                    border: "1px solid #ede8ff",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#7c5cfc" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1510", fontFamily: "'DM Sans', sans-serif" }}>Psalm 23:1</div>
                      <div style={{ fontSize: 11, color: "#8a8580", fontFamily: "'DM Sans', sans-serif" }}>Bookmarked 2 days ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRUST / DISCLAIMER ═══════════════════ */}
      <section style={{
        padding: "48px 24px",
        background: "#fff",
        borderTop: "1px solid #eee",
        borderBottom: "1px solid #eee",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "#6a655e",
          }}>
            <BrandName /> is an educational reading tool. It does not provide spiritual counseling, religious advice, or interpretive theology. Summaries describe what each book contains in plain language.
          </p>
        </div>
      </section>

      {/* ═══════════════════ BOTTOM CTA ═══════════════════ */}
      <section style={{
        padding: "80px 24px",
        textAlign: "center",
        background: "linear-gradient(180deg, #faf9f7 0%, #f3f0ff 100%)",
      }}>
        <h2 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 700,
          color: "#1a1510",
          marginBottom: 12,
        }}>
          Ready to read with clarity?
        </h2>
        <p style={{
          fontSize: 16,
          color: "#6a655e",
          marginBottom: 32,
          maxWidth: 420,
          margin: "0 auto 32px",
        }}>
          Start reading today &mdash; completely free. Upgrade anytime.
        </p>
        <div style={{
          display: "flex",
          gap: 14,
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <Link href="/signup" style={{
            display: "inline-block",
            padding: "16px 40px",
            fontSize: 17,
            fontWeight: 700,
            color: "#fff",
            background: "#7c5cfc",
            borderRadius: 12,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(124,92,252,0.3)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}>
            Create Free Account
          </Link>
          <Link href="/login" style={{
            display: "inline-block",
            padding: "16px 40px",
            fontSize: 17,
            fontWeight: 700,
            color: "#7c5cfc",
            background: "#fff",
            border: "2px solid #7c5cfc",
            borderRadius: 12,
            textDecoration: "none",
            transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
          }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer style={{
        padding: "32px 24px",
        textAlign: "center",
        borderTop: "1px solid #eee",
        background: "#fff",
      }}>
        <div style={{ marginBottom: 16 }}>
          <Logo height={200} style={{ margin: "0 auto 12px", display: "block" }} />
        </div>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 16,
        }}>
          {[
            { label: "Pricing", href: "/pricing" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Refund Policy", href: "/refunds" },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{
              fontSize: 13,
              color: "#6a655e",
              textDecoration: "none",
            }}>{item.label}</Link>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "#b0a89e" }}>
          support@clearbible.ai
        </p>
        <p style={{ fontSize: 12, color: "#ccc", marginTop: 4 }}>
          &copy; {new Date().getFullYear()} <BrandName />
        </p>
      </footer>
    </div>
  );
}
