import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata = {
  title: "Blog - ClearBible.ai",
  description:
    "Articles about understanding scripture, Bible study tips, and biblical questions answered clearly.",
};

const BLOG_POSTS = [
  {
    title: "How to Actually Remember What You Read in the Bible",
    excerpt:
      "Most people read the Bible but forget what they read within days. Here are 5 practical strategies to improve Bible retention.",
    category: "Bible Study",
    date: "March 2026",
    slug: "#",
  },
  {
    title: "What Is the Clear Bible Translation?",
    excerpt:
      "An introduction to the Clear Bible Translation — a modern, plain-English rendering of scripture designed for clarity and readability.",
    category: "Product",
    date: "March 2026",
    slug: "#",
  },
  {
    title: "10 Most Misquoted Bible Verses and What They Actually Mean",
    excerpt:
      "From 'money is the root of all evil' to 'God helps those who help themselves,' these commonly misquoted verses deserve a closer look.",
    category: "Scripture",
    date: "February 2026",
    slug: "#",
  },
  {
    title: "The Beginner's Guide to Reading the Bible Cover to Cover",
    excerpt:
      "Feeling overwhelmed by 66 books and 1,189 chapters? Here's a simple plan to read the Bible from start to finish.",
    category: "Bible Study",
    date: "February 2026",
    slug: "#",
  },
  {
    title: "How AI Is Changing Bible Study",
    excerpt:
      "From instant verse explanations to AI-powered search, technology is making scripture more accessible than ever. Here's what that means for readers.",
    category: "Technology",
    date: "January 2026",
    slug: "#",
  },
  {
    title: "Understanding the Old Testament: A Chapter-by-Chapter Overview",
    excerpt:
      "A high-level walkthrough of the Old Testament's 39 books, organized by section, with key themes and takeaways.",
    category: "Scripture",
    date: "January 2026",
    slug: "#",
  },
];

export default function BlogPage() {
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
            Blog
          </p>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.15, color: "#1a1510", marginBottom: 24 }}>
            Insights for <span className="gradient-text">deeper reading</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#4a4540" }}>
            Articles about understanding scripture, Bible study tips, and biblical questions answered clearly.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="marketing-section" style={{ background: "#faf9f7" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {BLOG_POSTS.map((post) => (
              <article key={post.title} className="marketing-card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#7C5CFC",
                      background: "#f0edff",
                      padding: "4px 12px",
                      borderRadius: 999,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {post.category}
                  </span>
                  <span style={{ fontSize: 13, color: "#b0a89e" }}>{post.date}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1510", marginBottom: 12, lineHeight: 1.4 }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#6a655e", flex: 1 }}>
                  {post.excerpt}
                </p>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#7C5CFC",
                    marginTop: 20,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Coming soon
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="marketing-section" style={{ background: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1510", marginBottom: 20 }}>
            Start reading with ClearBible today.
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#5a554e", marginBottom: 40 }}>
            Experience scripture the way it was meant to be understood.
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
