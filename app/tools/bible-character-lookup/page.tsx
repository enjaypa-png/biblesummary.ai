import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata = {
  title: "Bible Character Lookup - Free Bible Tool | ClearBible.ai",
  description: "Learn about key people in the Bible — who they were, what they did, and where they appear in scripture.",
};

export default function BibleCharacterLookupPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#2a2520", background: "#fff", paddingBottom: 0 }}>
      <MarketingNav />
      <section className="marketing-section hero-gradient" style={{ textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Link href="/tools" style={{ fontSize: 13, fontWeight: 600, color: "#7C5CFC", textDecoration: "none", marginBottom: 24, display: "inline-block" }}>
            &larr; All Tools
          </Link>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, color: "#1a1510", marginBottom: 24 }}>
            Bible Character <span className="gradient-text">Lookup</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#5a554e", marginBottom: 40 }}>
            Learn about key people in the Bible — who they were, what they did, and where they appear in scripture.
          </p>
          <div className="marketing-card" style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", padding: 48 }}>
            <p style={{ fontSize: 16, color: "#6a655e", marginBottom: 24 }}>
              This tool is coming soon. In the meantime, explore the full Bible in ClearBible.
            </p>
            <Link href="/signup" className="btn-primary">
              Start Reading Free
            </Link>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
