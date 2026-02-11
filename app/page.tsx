import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "BibleSummary.ai - Read & Understand the Bible",
  description:
    "A modern Bible reading app with AI-generated book summaries. Read, listen, and retain. King James Version Bible text and audio are always free.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Compliance header — visible immediately on landing */}
      <header
        className="w-full border-b px-5 py-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--foreground-secondary)" }}>
            <strong style={{ color: "var(--foreground)" }}>BibleSummary.ai</strong> is a digital
            Bible reading app. We sell optional AI-generated book summaries as educational reading
            tools. Bible text and audio are always free.{" "}
            <Link href="/pricing" className="underline" style={{ color: "var(--accent)" }}>
              Pricing
            </Link>{" "}
            &middot;{" "}
            <Link href="/terms" className="underline" style={{ color: "var(--accent)" }}>
              Terms
            </Link>{" "}
            &middot;{" "}
            <Link href="/privacy" className="underline" style={{ color: "var(--accent)" }}>
              Privacy
            </Link>{" "}
            &middot;{" "}
            <Link href="/refunds" className="underline" style={{ color: "var(--accent)" }}>
              Refunds
            </Link>{" "}
            &middot; support@biblesummary.ai
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto px-5 py-12 text-center">
        <h1
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ color: "var(--foreground)" }}
        >
          BibleSummary.ai
        </h1>
        <p
          className="text-[15px] leading-relaxed mb-8"
          style={{ color: "var(--foreground-secondary)" }}
        >
          Read, listen to, and retain the King James Version Holy Bible.
          <br />
          Bible text and audio are always free.
        </p>

        {/* What we offer */}
        <div
          className="rounded-xl p-5 mb-6 text-left"
          style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}
          >
            What We Offer
          </h2>
          <ul className="space-y-2.5 text-[14px]" style={{ color: "var(--foreground)" }}>
            <li className="flex items-start gap-2.5">
              <span style={{ color: "var(--success)" }} className="mt-0.5 flex-shrink-0">&#10003;</span>
              <span><strong>Free Bible text</strong> — Full King James Version, every book, chapter, and verse</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span style={{ color: "var(--success)" }} className="mt-0.5 flex-shrink-0">&#10003;</span>
              <span><strong>Free audio</strong> — Listen to any chapter read aloud</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span style={{ color: "var(--accent)" }} className="mt-0.5 flex-shrink-0">&#9733;</span>
              <span><strong>Book summaries</strong> — AI-generated educational reading tools: $0.99 per book or $14.99/year for all 66 books</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span style={{ color: "var(--accent)" }} className="mt-0.5 flex-shrink-0">&#9733;</span>
              <span><strong>Verse explanations</strong> — AI-generated plain-language explanations for individual verses</span>
            </li>
          </ul>
        </div>

        {/* Disclaimer */}
        <p
          className="text-[12px] leading-relaxed mb-8"
          style={{ color: "var(--foreground-secondary)" }}
        >
          BibleSummary.ai is an educational reading tool. It does not provide spiritual counseling,
          religious advice, or interpretive theology. Summaries describe what each book contains
          without interpretation.
        </p>

        {/* CTA */}
        <Link
          href="/bible"
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-[16px] font-semibold transition-all active:scale-95"
          style={{ backgroundColor: "var(--accent)", color: "white" }}
        >
          Start Reading
        </Link>

        <p className="mt-4 text-[13px]" style={{ color: "var(--foreground-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" className="underline" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
