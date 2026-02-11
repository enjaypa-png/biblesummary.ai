import Link from "next/link";

export const metadata = {
  title: "BibleSummary.ai - Read & Understand the Bible",
  description:
    "A modern Bible reading app with AI-generated book summaries. Read, listen, and retain. King James Version Bible text and audio are always free.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>

      {/* ── 1. Announcement Bar ── */}
      <div
        className="w-full px-5 py-2.5"
        style={{ backgroundColor: "var(--card)", borderBottom: "0.5px solid var(--border)" }}
      >
        <p
          className="max-w-3xl mx-auto text-center text-[12px] leading-relaxed"
          style={{ color: "var(--foreground-secondary)" }}
        >
          BibleSummary.ai is an educational Bible reading companion. Free Bible text and audio.
          Optional AI-powered summaries.{" "}
          <Link href="/pricing" className="underline" style={{ color: "var(--accent)" }}>Pricing</Link>
          {" "}&middot;{" "}
          <Link href="/terms" className="underline" style={{ color: "var(--accent)" }}>Terms</Link>
          {" "}&middot;{" "}
          <Link href="/privacy" className="underline" style={{ color: "var(--accent)" }}>Privacy</Link>
          {" "}&middot;{" "}
          <Link href="/refunds" className="underline" style={{ color: "var(--accent)" }}>Refunds</Link>
          {" "}&middot;{" "}
          support@biblesummary.ai
        </p>
      </div>

      {/* ── 2. Hero Section ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-12">
        <div className="max-w-xl mx-auto text-center">
          <h1
            className="font-bold tracking-tight mb-5"
            style={{ color: "var(--foreground)", fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15 }}
          >
            Read the Bible.
            <br />
            Understand what you read.
          </h1>

          <p
            className="text-[16px] leading-relaxed mb-10 max-w-md mx-auto"
            style={{ color: "var(--foreground-secondary)" }}
          >
            BibleSummary.ai combines the full King James Bible with optional AI-generated summaries
            designed to support clarity and retention.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/bible"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-[16px] font-semibold transition-all active:scale-[0.97]"
              style={{ backgroundColor: "var(--accent)", color: "white", boxShadow: "0 2px 12px rgba(37, 99, 235, 0.25)" }}
            >
              Start Reading
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center text-[15px] font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              View Pricing &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Value Section ── */}
      <section className="px-5 pb-16">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-center text-[13px] font-semibold uppercase tracking-[0.15em] mb-8"
            style={{ color: "var(--foreground-secondary)" }}
          >
            What&apos;s Included
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Free column */}
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <h3
                className="text-[15px] font-semibold mb-4"
                style={{ color: "var(--foreground)" }}
              >
                Free
              </h3>
              <ul className="space-y-3 text-[14px]" style={{ color: "var(--foreground)" }}>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--success)" }} className="flex-shrink-0 mt-px">&#10003;</span>
                  <span>Full King James Version</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--success)" }} className="flex-shrink-0 mt-px">&#10003;</span>
                  <span>Every book, chapter, and verse</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--success)" }} className="flex-shrink-0 mt-px">&#10003;</span>
                  <span>Audio playback</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--success)" }} className="flex-shrink-0 mt-px">&#10003;</span>
                  <span>Clean reading experience</span>
                </li>
              </ul>
            </div>

            {/* Premium column */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: "var(--card)",
                border: "1.5px solid var(--accent)",
                boxShadow: "0 2px 16px rgba(37, 99, 235, 0.08)",
              }}
            >
              <h3
                className="text-[15px] font-semibold mb-4"
                style={{ color: "var(--accent)" }}
              >
                Premium
              </h3>
              <ul className="space-y-3 text-[14px]" style={{ color: "var(--foreground)" }}>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0 mt-px">&#9733;</span>
                  <span>AI-generated book summaries</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0 mt-px">&#9733;</span>
                  <span>Plain-language verse explanations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0 mt-px">&#9733;</span>
                  <span>Personal notes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0 mt-px">&#9733;</span>
                  <span>Smart bookmarks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0 mt-px">&#9733;</span>
                  <span>Ad-free experience</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Clarity Section ── */}
      <section className="px-5 pb-16">
        <div className="max-w-lg mx-auto text-center">
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "var(--foreground-secondary)" }}
          >
            BibleSummary.ai is an educational reading tool.
            It does not provide spiritual counseling, religious advice, or interpretive theology.
            Summaries describe what each book contains in plain language.
          </p>
        </div>
      </section>

      {/* ── 5. CTA Section ── */}
      <section
        className="px-5 py-16"
        style={{ backgroundColor: "var(--card)" }}
      >
        <div className="max-w-md mx-auto text-center">
          <h2
            className="text-[22px] font-bold mb-6"
            style={{ color: "var(--foreground)" }}
          >
            Ready to read with clarity?
          </h2>
          <Link
            href="/bible"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-[16px] font-semibold transition-all active:scale-[0.97]"
            style={{ backgroundColor: "var(--accent)", color: "white", boxShadow: "0 2px 12px rgba(37, 99, 235, 0.25)" }}
          >
            Start Reading
          </Link>
          <p className="mt-4 text-[13px]" style={{ color: "var(--foreground-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" className="underline" style={{ color: "var(--accent)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* ── 6. Footer ── */}
      <footer
        className="w-full border-t px-5 py-8"
        style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] mb-4">
            <Link href="/pricing" style={{ color: "var(--foreground-secondary)" }} className="hover:underline">
              Pricing
            </Link>
            <Link href="/terms" style={{ color: "var(--foreground-secondary)" }} className="hover:underline">
              Terms of Service
            </Link>
            <Link href="/privacy" style={{ color: "var(--foreground-secondary)" }} className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/refunds" style={{ color: "var(--foreground-secondary)" }} className="hover:underline">
              Refund Policy
            </Link>
          </div>
          <p className="text-center text-[12px]" style={{ color: "var(--foreground-secondary)" }}>
            support@biblesummary.ai
          </p>
          <p className="text-center text-[12px] mt-1" style={{ color: "var(--foreground-secondary)", opacity: 0.7 }}>
            &copy; 2026 BibleSummary.ai
          </p>
        </div>
      </footer>
    </div>
  );
}
