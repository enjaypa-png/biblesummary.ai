import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blogPosts";

export const metadata: Metadata = {
  title: "Blog — ClearBible.ai",
  description:
    "Guides, insights, and tools to help you understand the Bible, remember what you read, and apply it to daily life.",
};

export default function BlogPage() {
  return (
    <main style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <style>{`
        .blog-card {
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e8e5e0;
          background: #fff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .blog-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 32px rgba(30, 40, 80, 0.10);
        }
        .blog-card-img {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          display: block;
          background: #f0ece8;
        }
        .blog-card-body {
          padding: 20px 22px 24px;
        }
        .blog-card-date {
          font-size: 13px;
          color: #9a958e;
          margin-bottom: 8px;
          font-family: 'DM Sans', sans-serif;
        }
        .blog-card-title {
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1510;
          line-height: 1.4;
          margin: 0;
        }
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
          margin-top: 40px;
        }
        @media (max-width: 640px) {
          .blog-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Header */}
        <h1
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 700,
            color: "#1a1510",
            marginBottom: 12,
            letterSpacing: "-0.02em",
          }}
        >
          ClearBible.ai Blog
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "#6a655e",
            maxWidth: 520,
            lineHeight: 1.65,
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Guides, insights, and tools to help you understand the Bible,
          remember what you read, and apply it to daily life.
        </p>

        {/* Grid */}
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image}
                alt={post.imageAlt}
                className="blog-card-img"
              />
              <div className="blog-card-body">
                <p className="blog-card-date">{post.date}</p>
                <h2 className="blog-card-title">{post.title}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
