import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata = {
  title: "How It Works - ClearBible.ai",
  description:
    "Learn how ClearBible helps you understand, remember, and apply scripture to your life.",
};

const STEPS = [
  {
    number: "01",
    title: "Choose What to Read",
    desc: "Pick any of the 66 books of the Bible. Whether you're starting from Genesis or jumping into Psalms, ClearBible is organized to make it easy to navigate.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Read or Listen",
    desc: "Read in the King James Version or the Clear Bible Translation — a modern, plain-English rendering. Every chapter also includes high-quality audio narration.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Understand Every Verse",
    desc: "Tap any verse to get a plain-language explanation. No theological jargon or complex commentary — just clear, simple meaning.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Remember with Summaries",
    desc: "After reading, check the chapter summary to reinforce what you learned. Each summary captures the key events and lessons so the message sticks with you.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 7h10" />
        <path d="M7 12h10" />
        <path d="M7 17h6" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Apply with AI Search",
    desc: "Ask any question about the Bible and get instant answers supported by scripture. Connect what you read to real-life situations.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Track Your Progress",
    desc: "Bookmark your place, highlight meaningful passages in 5 colors, and add personal notes. Everything syncs to your account.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
  },
];

export default function HowItWorksPage() {
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
            How It Works
          </p>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.15, color: "#1a1510", marginBottom: 24 }}>
            From reading to{" "}
            <span className="gradient-text">understanding</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#4a4540" }}>
            ClearBible makes it simple to read the Bible, understand what you&apos;re reading, and actually remember it. Here&apos;s how.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="marketing-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr",
                  gap: 32,
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: i % 2 === 0 ? "#f5f2ff" : "linear-gradient(135deg, #7C5CFC 0%, #5A3BFF 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: i % 2 === 0 ? "#7C5CFC" : "#fff" }}>
                    {step.icon}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#7C5CFC",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginBottom: 8,
                      display: "block",
                    }}
                  >
                    Step {step.number}
                  </span>
                  <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1a1510", marginBottom: 12 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 16, lineHeight: 1.7, color: "#4a4540" }}>
                    {step.desc}
                  </p>
                </div>
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
            Ready to start?
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#4a4540", marginBottom: 40 }}>
            Create a free account and begin reading with clarity today.
          </p>
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
