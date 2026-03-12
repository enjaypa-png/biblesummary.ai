import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — ClearBible.ai",
  description: "Insights on Bible reading, translation, and understanding scripture in plain English.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen px-6 py-16" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <h1
          className="font-semibold tracking-tight mb-3"
          style={{
            color: "var(--foreground)",
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "clamp(2rem, 6vw, 2.75rem)",
          }}
        >
          Blog
        </h1>
        <p className="text-[16px] mb-12" style={{ color: "var(--foreground-secondary)" }}>
          Insights on Bible reading, translation, and understanding scripture in plain English.
        </p>

        <p className="text-[15px]" style={{ color: "var(--foreground-secondary)" }}>
          No posts yet — check back soon.
        </p>
      </div>
    </main>
  );
}
