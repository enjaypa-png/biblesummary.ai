import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Refund Policy - ClearBible.ai",
  description: "Refund Policy for ClearBible.ai",
};

export default function RefundsPage() {
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
            Refund Policy
          </h1>
          <span className="w-[50px]" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 py-8">
        <div className="space-y-6 text-[14px] leading-relaxed" style={{ color: "var(--foreground)" }}>
          <p style={{ color: "var(--foreground-secondary)" }}>
            Last updated: March 2026
          </p>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">Refund Policy</h2>
            <p>
              ClearBible.ai subscriptions are non-refundable once a purchase has been completed. You may cancel your subscription at any time to prevent future billing.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">Contact</h2>
            <p>
              For billing questions, contact us at <strong>support@clearbible.ai</strong>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
