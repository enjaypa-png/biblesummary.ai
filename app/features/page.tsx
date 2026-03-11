import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata = {
  title: "Features - ClearBible.ai",
  description:
    "Explore all ClearBible features: AI Bible search, verse explanations, book summaries, audio narration, highlights, notes, and more.",
};

const FEATURES = [
  {
    title: "AI Bible Search",
    desc: "Ask any question about the Bible and get an instant AI-powered answer with supporting verses. Whether you want to know who Samson was or what the Bible says about forgiveness, just ask.",
    emoji: "🔍",
    premium: true,
  },
  {
    title: "Verse Explanations",
    desc: "Tap any verse to instantly understand its meaning. Get clear, plain-language explanations without theological jargon. Every explanation is designed to help you understand the text, not interpret it for you.",
    emoji: "✨",
    premium: true,
  },
  {
    title: "Book Summaries",
    desc: "Every chapter and book comes with a carefully audited summary. Quickly understand what happened, who was involved, and the key takeaway — all in plain language.",
    emoji: "📋",
    premium: true,
  },
  {
    title: "Audio Narration",
    desc: "Listen to every chapter with high-quality AI-generated narration. Perfect for commuting, exercising, or studying hands-free. Multiple voice options available.",
    emoji: "🎧",
    premium: true,
  },
  {
    title: "Multiple Translations",
    desc: "Switch between the King James Version (KJV) and the Clear Bible Translation — a modern, plain-English rendering that makes scripture accessible to everyone.",
    emoji: "📖",
    premium: false,
  },
  {
    title: "Notes",
    desc: "Write personal notes directly on any verse. Your thoughts and reflections are saved to your account so you can return to them anytime.",
    emoji: "📝",
    premium: false,
  },
  {
    title: "Highlights",
    desc: "Mark meaningful passages with 5 different highlight colors. Organize your reading by theme, topic, or personal meaning.",
    emoji: "🖍️",
    premium: false,
  },
  {
    title: "Bookmarks & Progress",
    desc: "Bookmark your favorite passages and track your reading progress. Pick up exactly where you left off, every time.",
    emoji: "🔖",
    premium: false,
  },
];

export default function FeaturesPage() {
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
            Features
          </p>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.15, color: "#1a1510", marginBottom: 24 }}>
            Everything you need to{" "}
            <span className="gradient-text">study scripture</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#4a4540" }}>
            ClearBible combines powerful AI tools with a beautiful reading experience so you can understand, remember, and apply what you read.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="marketing-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {FEATURES.map((f) => (
              <div key={f.title} className="marketing-card" style={{ position: "relative" }}>
                {f.premium && (
                  <span
                    style={{
                      position: "absolute",
                      top: 20,
                      right: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#7C5CFC",
                      background: "#f0edff",
                      padding: "4px 12px",
                      borderRadius: 999,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Premium
                  </span>
                )}
                <div style={{ fontSize: 40, marginBottom: 20 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1510", marginBottom: 12 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "#4a4540" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="marketing-section purple-gradient-bg"
        style={{ textAlign: "center" }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#fff", marginBottom: 20 }}>
            Start reading with clarity today.
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", marginBottom: 40 }}>
            Free to read. Upgrade anytime for AI explanations, summaries, and more.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 36px",
                fontSize: 16,
                fontWeight: 700,
                color: "#7C5CFC",
                background: "#fff",
                borderRadius: 999,
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              Start Reading Free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 36px",
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.3)",
                borderRadius: 999,
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
