import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Pricing - BibleSummary.ai",
  description:
    "BibleSummary.ai pricing. Free Bible text and audio. Optional paid summaries and verse explanations.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--background-blur)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            &larr; Home
          </Link>
          <h1
            className="text-[15px] font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Pricing
          </h1>
          <span className="w-[50px]" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 py-8">
        <div className="text-center mb-8">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Simple, Transparent Pricing
          </h2>
          <p className="text-[15px]" style={{ color: "var(--foreground-secondary)" }}>
            Bible text and audio are always free. Pay only for the features you want.
          </p>
        </div>

        <div className="space-y-4">
          {/* Free tier */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
          >
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
                Free
              </h3>
              <span
                className="text-[13px] font-medium px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(5, 150, 105, 0.1)", color: "var(--success)" }}
              >
                Always free
              </span>
            </div>
            <ul className="space-y-2 text-[14px]" style={{ color: "var(--foreground)" }}>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                <span>Full King James Version Bible text — all 66 books</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                <span>Audio playback for every chapter</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                <span>Bookmarks and reading progress tracking</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                <span>Personal notes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--success)" }} className="flex-shrink-0">&#10003;</span>
                <span>Search across the entire Bible</span>
              </li>
            </ul>
          </div>

          {/* Book summaries */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--card)", border: "1.5px solid var(--accent)" }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
                Book Summaries
              </h3>
            </div>
            <p className="text-[13px] mb-3" style={{ color: "var(--foreground-secondary)" }}>
              AI-generated educational reading tools to help you retain what you read
            </p>

            <div className="space-y-3 mb-4">
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: "var(--background)" }}
              >
                <div>
                  <span className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                    Per Book
                  </span>
                  <p className="text-[12px]" style={{ color: "var(--foreground-secondary)" }}>
                    Buy individual book summaries
                  </p>
                </div>
                <span className="text-[20px] font-bold" style={{ color: "var(--accent)" }}>
                  $0.99
                </span>
              </div>

              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: "var(--background)" }}
              >
                <div>
                  <span className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                    Annual Pass
                  </span>
                  <p className="text-[12px]" style={{ color: "var(--foreground-secondary)" }}>
                    All 66 books — less than $0.23 per book
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[20px] font-bold" style={{ color: "var(--accent)" }}>
                    $14.99
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--foreground-secondary)" }}>
                    /year
                  </span>
                </div>
              </div>
            </div>

            <ul className="space-y-2 text-[14px]" style={{ color: "var(--foreground)" }}>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                <span>Detailed summaries covering every chapter of each book</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                <span>Listen to summaries read aloud</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                <span>Helps you remember and retain what you&apos;ve read</span>
              </li>
            </ul>
          </div>

          {/* Verse explanations */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
                Verse Explanations
              </h3>
            </div>
            <p className="text-[13px] mb-3" style={{ color: "var(--foreground-secondary)" }}>
              AI-generated plain-language explanations for individual verses
            </p>

            <div
              className="flex items-center justify-between p-3 rounded-lg mb-4"
              style={{ backgroundColor: "var(--background)" }}
            >
              <div>
                <span className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                  Monthly
                </span>
                <p className="text-[12px]" style={{ color: "var(--foreground-secondary)" }}>
                  Unlimited verse explanations
                </p>
              </div>
              <div className="text-right">
                <span className="text-[20px] font-bold" style={{ color: "var(--accent)" }}>
                  $4.99
                </span>
                <span className="text-[13px]" style={{ color: "var(--foreground-secondary)" }}>
                  /month
                </span>
              </div>
            </div>

            <ul className="space-y-2 text-[14px]" style={{ color: "var(--foreground)" }}>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                <span>Tap any verse for an instant plain-language explanation</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span style={{ color: "var(--accent)" }} className="flex-shrink-0">&#10003;</span>
                <span>Understand difficult passages without leaving the reading experience</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <p
          className="text-center text-[12px] leading-relaxed mt-8"
          style={{ color: "var(--foreground-secondary)" }}
        >
          All paid features are optional. BibleSummary.ai is an educational reading tool.
          AI-generated content describes what the biblical text contains without interpretation.
          See our{" "}
          <Link href="/refunds" className="underline" style={{ color: "var(--accent)" }}>
            Refund Policy
          </Link>{" "}
          for details on cancellations and refunds.
        </p>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            href="/bible"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-[16px] font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            Start Reading for Free
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
