import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata = {
  title: "Free Bible Tools - ClearBible.ai",
  description:
    "Free Bible tools: verse generator, reading time calculator, character lookup, sermon outline generator, and verse explanation tool.",
};

const TOOLS = [
  {
    name: "Bible Verse Generator",
    desc: "Generate random Bible verses for daily inspiration, devotionals, or study sessions. Filter by book or topic.",
    slug: "bible-verse-generator",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
  },
  {
    name: "Bible Reading Time Calculator",
    desc: "Find out how long it takes to read any book, chapter, or the entire Bible. Plan your reading schedule effectively.",
    slug: "bible-reading-time-calculator",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    name: "Bible Character Lookup",
    desc: "Learn about key people in the Bible — who they were, what they did, and where they appear in scripture.",
    slug: "bible-character-lookup",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: "Sermon Outline Generator",
    desc: "Get a structured outline for any Bible passage. Perfect for pastors, small group leaders, or personal study.",
    slug: "sermon-outline-generator",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 7h10" />
        <path d="M7 12h10" />
        <path d="M7 17h6" />
      </svg>
    ),
  },
  {
    name: "Verse Explanation Tool",
    desc: "Get a plain-language explanation for any verse. Understand the meaning without theological jargon.",
    slug: "verse-explanation-tool",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
];

export default function ToolsPage() {
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
            Free Resources
          </p>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.15, color: "#1a1510", marginBottom: 24 }}>
            Free <span className="gradient-text">Bible Tools</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#4a4540" }}>
            Useful tools to help you study, plan, and understand the Bible better. All completely free.
          </p>
        </div>
      </section>

      {/* Tools grid */}
      <section className="marketing-section" style={{ background: "#faf9f7" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="marketing-grid-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="marketing-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "#f5f2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  {tool.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1510", marginBottom: 10 }}>
                  {tool.name}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "#6a655e", marginBottom: 16 }}>
                  {tool.desc}
                </p>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#7C5CFC",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Try it free
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="marketing-section" style={{ background: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1510", marginBottom: 20 }}>
            Want the full ClearBible experience?
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#5a554e", marginBottom: 40 }}>
            Read the Bible, get AI explanations, listen to audio, and more — all in one place.
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
