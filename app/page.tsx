"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const FEATURES_FREE = [
  { icon: "📖", name: "Two Bible Versions", desc: "Read the King James Version and the Clear Bible Translation — both included free." },
  { icon: "🎧", name: "Read or Listen", desc: "Switch between text and audio anytime." },
  { icon: "🖍️", name: "Highlight", desc: "Mark meaningful passages as you read." },
  { icon: "📝", name: "Notes", desc: "Write your thoughts directly inside the text." },
  { icon: "🔖", name: "Bookmarks", desc: "Pick up exactly where you left off." },
];

const FEATURES_PREMIUM = [
  {
    icon: "✨",
    name: "Explain Any Verse",
    desc: "Tap any verse and get an instant, plain-language explanation. No theological jargon — just clarity.",
    highlight: true,
  },
  {
    icon: "📋",
    name: "Chapter Summaries",
    desc: "AI-generated summaries after every chapter so you retain what you just read.",
    highlight: true,
  },
];

// Interactive demo component - this is the conversion engine
const DEMO_VERSE_TEXT = "For the love of money is the root of all evil: which while some coveted after, they have erred from the faith, and pierced themselves through with many sorrows.";

function VerseDemo() {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [audioEl] = useState(() => typeof window !== "undefined" ? new Audio() : null);

  // Stop speech when explanation is closed
  useEffect(() => {
    if (!showExplanation && isSpeaking) {
      if (audioEl) { audioEl.pause(); audioEl.src = ""; }
      setIsSpeaking(false);
    }
  }, [showExplanation, isSpeaking, audioEl]);

  const toggleSpeech = useCallback(async () => {
    if (isSpeaking) {
      if (audioEl) { audioEl.pause(); audioEl.src = ""; }
      setIsSpeaking(false);
      return;
    }
    const text = explanationText;
    if (!text) return;
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioEl) {
        audioEl.src = url;
        audioEl.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audioEl.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        await audioEl.play();
      }
    } catch {
      setIsSpeaking(false);
    }
  }, [isSpeaking, explanationText, audioEl]);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", fontFamily: "'Source Serif 4', Georgia, serif" }}>
      {/* Fake reader UI */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(30,40,80,0.10), 0 1.5px 4px rgba(30,40,80,0.06)",
        overflow: "hidden",
        border: "1px solid #e8e5e0",
      }}>
        {/* Top bar */}
        <div style={{
          background: "#f8f7f5",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e8e5e0",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{ fontSize: 13, color: "#8a8580", fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>1 Timothy 6</span>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 16, opacity: 0.4, cursor: "default" }}>🔖</span>
            <span style={{ fontSize: 16, opacity: 0.4, cursor: "default" }}>🎧</span>
          </div>
        </div>

        {/* Verses */}
        <div style={{ padding: "28px 24px 20px" }}>
          {/* Verse 9 - context */}
          <p style={{ fontSize: 17, lineHeight: 1.85, color: "#3a3530", margin: "0 0 16px" }}>
            <span style={{ color: "#b0a89e", fontWeight: 700, fontSize: 13, marginRight: 6, fontFamily: "'DM Sans', sans-serif" }}>9</span>
            But they that will be rich fall into temptation and a snare, and into many foolish and hurtful lusts, which drown men in destruction and perdition.
          </p>

          {/* Verse 10 - interactive */}
          <div style={{ position: "relative" }}>
            <p
onClick={async () => {
                  const next = !showExplanation;
                  setShowExplanation(next);
                  if (next && !explanationText) {
                    setExplanationLoading(true);
                    try {
                      const res = await fetch("/api/explain-verse", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          book: "1 Timothy", chapter: 6, verse_start: 10,
                          verseText: DEMO_VERSE_TEXT,
                        }),
                      });
                      const data = await res.json();
                      setExplanationText(data.explanation || data.text || null);
                    } catch { /* keep null */ }
                    setExplanationLoading(false);
                  }
                }}
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
              }}
            >
              <span style={{ color: "#b0a89e", fontWeight: 700, fontSize: 13, marginRight: 6, fontFamily: "'DM Sans', sans-serif" }}>10</span>
              For the love of money is the root of all evil: which while some coveted after, they have erred from the faith, and pierced themselves through with many sorrows.
              {!showExplanation && (
                <span style={{
                  display: "inline-block",
                  marginLeft: 8,
                  fontSize: 11,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  color: "#7c5cfc",
                  background: "#f0edff",
                  padding: "2px 10px",
                  borderRadius: 20,
                  cursor: "pointer",
                  animation: "pulse-badge 2s ease-in-out infinite",
                  verticalAlign: "middle",
                }}>
                  ← tap to explain
                </span>
              )}
            </p>

            {/* AI Explanation card */}
            {showExplanation && (
              <div style={{
                marginTop: 12,
                padding: "18px 20px",
                background: "linear-gradient(135deg, #f8f6ff 0%, #f0edff 100%)",
                borderRadius: 12,
                borderLeft: "3px solid #7c5cfc",
                animation: "slideDown 0.35s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>✨</span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#7c5cfc",
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Plain-Language Explanation
                    </span>
                  </div>
                  {explanationText && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSpeech(); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        color: isSpeaking ? "#fff" : "#7c5cfc",
                        background: isSpeaking ? "#7c5cfc" : "#fff",
                        border: "1.5px solid #7c5cfc",
                        borderRadius: 20,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isSpeaking ? (
                          <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>
                        ) : (
                          <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>
                        )}
                      </svg>
                      {isSpeaking ? "Stop" : "Listen"}
                    </button>
                  )}
                </div>
                <p style={{
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: "#4a4550",
                  margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {explanationText || "Loading explanation..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter summary preview */}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button
          onClick={() => setShowSummary(!showSummary)}
          style={{
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            background: showSummary ? "#7c5cfc" : "#fff",
            color: showSummary ? "#fff" : "#7c5cfc",
            border: "1.5px solid #7c5cfc",
            borderRadius: 10,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {showSummary ? "Hide Chapter Summary" : "📋 See Chapter Summary"}
        </button>
      </div>

      {showSummary && (
        <div style={{
          marginTop: 16,
          padding: "22px 24px",
          background: "linear-gradient(135deg, #f8f6ff 0%, #f0edff 100%)",
          borderRadius: 14,
          border: "1.5px solid #d9d0ff",
          animation: "slideDown 0.35s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#7c5cfc",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Chapter Summary — 1 Timothy 6
            </span>
          </div>
          <ul style={{
            fontSize: 15,
            lineHeight: 1.75,
            color: "#4a4550",
            margin: 0,
            paddingLeft: 20,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <li style={{ marginBottom: 6 }}>Paul instructs Timothy on how servants should treat their masters.</li>
            <li style={{ marginBottom: 6 }}>He warns against false teachers who use religion as a way to get rich.</li>
            <li style={{ marginBottom: 6 }}>He describes contentment as &ldquo;great gain&rdquo; — having food and clothing should be enough.</li>
            <li style={{ marginBottom: 6 }}>He warns that the desire for wealth leads to temptation, destruction, and wandering from faith.</li>
            <li>He tells Timothy to pursue righteousness, godliness, faith, love, and endurance instead.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, name, desc, highlight, delay }: { icon: string; name: string; desc: string; highlight?: boolean; delay: number }) {
  return (
    <div style={{
      background: highlight ? "linear-gradient(135deg, #faf9ff 0%, #f3f0ff 100%)" : "#fff",
      border: highlight ? "1.5px solid #d9d0ff" : "1px solid #e8e5e0",
      borderRadius: 14,
      padding: "24px 22px",
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
      cursor: "default",
      animation: `fadeUp 0.6s ease ${delay}s both`,
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 12px 32px rgba(30,40,80,0.10)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
    >
      {highlight && (
        <div style={{
          position: "absolute",
          top: 12,
          right: 12,
          fontSize: 10,
          fontWeight: 700,
          color: "#7c5cfc",
          background: "#ede8ff",
          padding: "3px 10px",
          borderRadius: 20,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}>
          Premium
        </div>
      )}
      <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
      <h3 style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 17,
        fontWeight: 700,
        color: "#2a2520",
        margin: "0 0 8px",
      }}>{name}</h3>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        lineHeight: 1.65,
        color: "#7a756e",
        margin: 0,
      }}>{desc}</p>
    </div>
  );
}

function StatBlock({ number, label }: { number: string; label: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: 42,
        fontWeight: 700,
        color: "#2a2520",
        lineHeight: 1.1,
      }}>{number}</div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        color: "#8a8580",
        marginTop: 6,
        fontWeight: 500,
      }}>{label}</div>
    </div>
  );
}

function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1, padding: "0 16px" }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #7c5cfc 0%, #7c5cfc 100%)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
        margin: "0 auto 16px",
      }}>{number}</div>
      <h3 style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 17,
        fontWeight: 700,
        color: "#2a2520",
        margin: "0 0 8px",
      }}>{title}</h3>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        color: "#8a8580",
        margin: 0,
        lineHeight: 1.6,
      }}>{desc}</p>
    </div>
  );
}

export default function ClearBibleLanding() {
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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section style={{
        position: "relative",
        padding: "80px 24px 60px",
        textAlign: "center",
        background: "linear-gradient(180deg, #fff 0%, #faf9f7 100%)",
        overflow: "hidden",
      }}>
        {/* Subtle decorative element */}
        <div style={{
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,92,252,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          {/* Logo */}
          <div style={{ marginBottom: 28, animation: "fadeUp 0.5s ease both" }}>
            <Image
              src="/brand/logo.svg"
              alt="ClearBible.ai"
              width={400}
              height={108}
              priority
              style={{ margin: "0 auto", maxWidth: 400, width: "100%", height: "auto" }}
            />
          </div>

          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "clamp(36px, 6vw, 56px)",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#1a1510",
            marginBottom: 20,
            animation: "fadeUp 0.7s ease both",
          }}>
            <span style={{ color: "#7c5cfc" }}>The Bible.</span> Finally easy to{" "}
            <span style={{ color: "#7c5cfc" }}>understand.</span>
          </h1>

          <p style={{
            fontSize: 18,
            lineHeight: 1.65,
            color: "#3a3530",
            maxWidth: 540,
            margin: "0 auto 36px",
            animation: "fadeUp 0.7s ease 0.15s both",
          }}>
            Read in plain modern English or the KJV — free forever. AI explains every verse instantly.
          </p>

          <div style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            animation: "fadeUp 0.7s ease 0.3s both",
          }}>
            <Link href="/signup" style={{
              display: "inline-block",
              padding: "15px 36px",
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(135deg, #7c5cfc 0%, #7c5cfc 100%)",
              borderRadius: 12,
              textDecoration: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 4px 16px rgba(124,92,252,0.3)",
            }}>
              Create Free Account
            </Link>
            <Link href="/login" style={{
              display: "inline-block",
              padding: "15px 36px",
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
            color: "#b0a89e",
            marginTop: 16,
            animation: "fadeUp 0.7s ease 0.4s both",
          }}>
            No credit card required · Free forever plan available
          </p>

          <div style={{
            marginTop: 16,
            animation: "fadeUp 0.7s ease 0.5s both",
          }}>
            <Link href="/pricing" style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#7c5cfc",
              textDecoration: "none",
            }}>
              View Pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ORIGIN STORY ═══════════════════ */}
      <section style={{
        padding: "64px 24px",
        textAlign: "center",
        background: "#fff",
        borderTop: "1px solid #eee",
        borderBottom: "1px solid #eee",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", animation: "fadeUp 0.7s ease both" }}>
          <div style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "clamp(20px, 3.5vw, 26px)",
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1.8,
            color: "#3a3530",
          }}>
            <p style={{ margin: "0 0 8px" }}>&ldquo;I committed to reading the Bible cover to cover.</p>
            <p style={{ margin: "0 0 8px" }}>But when I revisited earlier chapters, I realized I wasn&apos;t truly retaining it.</p>
            <p style={{
              margin: "24px 0 0",
              fontStyle: "normal",
              fontWeight: 700,
              color: "#1a1510",
            }}>
              That&apos;s when I decided to build a better way to read the Bible and remember.&rdquo;
            </p>
          </div>
          <p style={{
            marginTop: 20,
            fontSize: 15,
            fontWeight: 600,
            color: "#8a8580",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.5,
          }}>
            — Nicholas Palladino, Founder
          </p>
          <div style={{
            marginTop: 20,
            width: 48,
            height: 3,
            background: "linear-gradient(135deg, #7c5cfc 0%, #7c5cfc 100%)",
            borderRadius: 2,
            margin: "20px auto 0",
          }} />
        </div>
      </section>

      {/* ═══════════════════ INTERACTIVE DEMO ═══════════════════ */}
      <section style={{
        padding: "40px 24px 80px",
        maxWidth: 800,
        margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#7c5cfc",
            marginBottom: 12,
          }}>
            Try it yourself
          </p>
          <h2 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "clamp(26px, 4vw, 36px)",
            fontWeight: 700,
            color: "#1a1510",
            marginBottom: 12,
          }}>
            See what reading with clarity looks like
          </h2>
          <p style={{
            fontSize: 16,
            color: "#8a8580",
            maxWidth: 460,
            margin: "0 auto",
          }}>
            Tap verse 10 below, then check out the chapter summary.
          </p>
        </div>

        <VerseDemo />
      </section>

      {/* ═══════════════════ STATS ═══════════════════ */}
      <section style={{
        padding: "48px 24px",
        background: "#fff",
        borderTop: "1px solid #eee",
        borderBottom: "1px solid #eee",
      }}>
        <div style={{
          maxWidth: 700,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: 32,
        }}>
          <StatBlock number="66" label="Books of the Bible" />
          <StatBlock number="1,189" label="Chapters" />
          <StatBlock number="100%" label="Free to Read" />
        </div>
      </section>

      {/* ═══════════════════ FREE FEATURES ═══════════════════ */}
      <section style={{
        padding: "80px 24px",
        maxWidth: 900,
        margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#22a867",
            marginBottom: 12,
          }}>
            Free forever
          </p>
          <h2 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "clamp(26px, 4vw, 36px)",
            fontWeight: 700,
            color: "#1a1510",
            marginBottom: 12,
          }}>
            Everything you need to read the Bible
          </h2>
          <p style={{
            fontSize: 16,
            color: "#8a8580",
            maxWidth: 500,
            margin: "0 auto",
          }}>
            No account required for basic reading. Sign up free to unlock notes, highlights, and bookmarks.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}>
          {FEATURES_FREE.map((f, i) => (
            <FeatureCard key={f.name} {...f} delay={0.1 * i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════ PREMIUM FEATURES ═══════════════════ */}
      <section style={{
        padding: "80px 24px",
        background: "linear-gradient(180deg, #f5f2ff 0%, #faf9f7 100%)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "#7c5cfc",
              marginBottom: 12,
            }}>
              Go deeper
            </p>
            <h2 style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: 700,
              color: "#1a1510",
              marginBottom: 12,
            }}>
              Understand what you&apos;re reading — instantly
            </h2>
            <p style={{
              fontSize: 16,
              color: "#8a8580",
              maxWidth: 520,
              margin: "0 auto",
            }}>
              Premium adds AI-powered explanations and summaries that break down the Bible into clear, modern language. No theological jargon — just the meaning.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            maxWidth: 640,
            margin: "0 auto",
          }}>
            {FEATURES_PREMIUM.map((f, i) => (
              <FeatureCard key={f.name} {...f} delay={0.1 * i} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/pricing" style={{
              display: "inline-block",
              padding: "14px 32px",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(135deg, #7c5cfc 0%, #7c5cfc 100%)",
              borderRadius: 12,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(124,92,252,0.3)",
              transition: "transform 0.2s ease",
            }}>
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section style={{
        padding: "80px 24px",
        maxWidth: 800,
        margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#7c5cfc",
            marginBottom: 12,
          }}>
            Simple as 1-2-3
          </p>
          <h2 style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "clamp(26px, 4vw, 36px)",
            fontWeight: 700,
            color: "#1a1510",
          }}>
            How it works
          </h2>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
        }}>
          <StepCard number="1" title="Pick a Book" desc="Choose any of the 66 books of the Bible." />
          <StepCard number="2" title="Read or Listen" desc="Full KJV and Clear Bible Translation with audio playback for every chapter." />
          <StepCard number="3" title="Go Deeper" desc="Tap any verse for a plain-language explanation." />
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
            color: "#8a8580",
          }}>
            ClearBible.ai is an educational reading tool. It does not provide spiritual counseling, religious advice, or interpretive theology. Summaries describe what each book contains in plain language.
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
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 700,
          color: "#1a1510",
          marginBottom: 12,
        }}>
          Ready to read with clarity?
        </h2>
        <p style={{
          fontSize: 16,
          color: "#8a8580",
          marginBottom: 32,
          maxWidth: 420,
          margin: "0 auto 32px",
        }}>
          Start reading the King James Version or Clear Bible Translation today — completely free. Upgrade anytime.
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
            background: "linear-gradient(135deg, #7c5cfc 0%, #7c5cfc 100%)",
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
          <Image
            src="/brand/logo-icon.svg"
            alt="ClearBible.ai"
            width={40}
            height={40}
            style={{ margin: "0 auto 12px", height: "auto", objectFit: "contain" }}
          />
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
              color: "#8a8580",
              textDecoration: "none",
            }}>{item.label}</Link>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "#b0a89e" }}>
          support@clearbible.ai
        </p>
        <p style={{ fontSize: 12, color: "#ccc", marginTop: 4 }}>
          &copy; {new Date().getFullYear()} ClearBible.ai
        </p>
      </footer>
    </div>
  );
}
