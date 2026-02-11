import Link from "next/link";

export const metadata = {
  title: "Checkout Canceled - BibleSummary.ai",
};

export default function PricingCancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "var(--card)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--foreground-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          Checkout Canceled
        </h1>

        <p className="text-[15px] mb-8" style={{ color: "var(--foreground-secondary)" }}>
          No worries — you haven&apos;t been charged. You can return to the pricing page anytime.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            Back to Pricing
          </Link>
          <Link
            href="/bible"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "var(--card)", color: "var(--foreground)", border: "0.5px solid var(--border)" }}
          >
            Continue Reading
          </Link>
        </div>
      </div>
    </div>
  );
}
