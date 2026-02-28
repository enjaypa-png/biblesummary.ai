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
            Last updated: February 2025
          </p>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">Our Commitment</h2>
            <p>
              We want you to be satisfied with your purchase. If you are not happy with a paid
              feature, we are happy to help.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">Individual Book Summaries ($0.99)</h2>
            <p>
              If you purchased an individual book summary and are unsatisfied for any reason, you
              may request a full refund within <strong>7 days</strong> of purchase. After 7 days,
              refunds are granted at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">Annual Summary Pass ($14.99/year)</h2>
            <p>
              Annual summary pass subscriptions may be refunded in full within{" "}
              <strong>14 days</strong> of the initial purchase or renewal. After 14 days, you may
              cancel your subscription at any time and retain access until the end of your current
              billing period. No partial refunds are issued for unused time after the 14-day window.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">Verse Explanation Subscription</h2>
            <p>
              Monthly subscriptions may be canceled at any time. Upon cancellation, you retain
              access until the end of your current billing period. Refunds for the current billing
              cycle are available within <strong>7 days</strong> of the most recent charge.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">How to Request a Refund</h2>
            <p>
              To request a refund, email us at <strong>support@clearbible.ai</strong> with:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>The email address associated with your account</li>
              <li>The product or subscription you would like refunded</li>
              <li>The reason for your refund request (optional, but helps us improve)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">Processing Time</h2>
            <p>
              Refund requests are typically reviewed within <strong>1-2 business days</strong>.
              Once approved, refunds are processed through Stripe and may take 5-10 business days
              to appear on your statement, depending on your bank.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">Canceling a Subscription</h2>
            <p>
              You can cancel any active subscription at any time from the &ldquo;More&rdquo; tab
              in the app under &ldquo;Subscriptions.&rdquo; Cancellation stops future charges but
              you keep access until the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">Contact</h2>
            <p>
              For refund requests or billing questions, contact us at{" "}
              <strong>support@clearbible.ai</strong>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
