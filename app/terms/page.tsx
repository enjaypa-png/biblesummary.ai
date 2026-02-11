import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service - BibleSummary.ai",
  description: "Terms of Service for BibleSummary.ai",
};

export default function TermsPage() {
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
            Terms of Service
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
            <h2 className="text-[17px] font-semibold mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using BibleSummary.ai (&ldquo;the Service&rdquo;), you agree to be
              bound by these Terms of Service. If you do not agree to these terms, do not use the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">2. Description of Service</h2>
            <p>
              BibleSummary.ai is a digital Bible reading application. The Service provides free
              access to the King James Version Bible text and audio playback. We also offer optional
              paid features including AI-generated book summaries and AI-generated verse
              explanations. These paid features are educational reading tools designed to help users
              retain and understand what they read.
            </p>
            <p className="mt-2">
              BibleSummary.ai does not provide spiritual counseling, religious advice, pastoral
              guidance, or interpretive theology. All AI-generated content describes what the
              biblical text contains without theological interpretation.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">3. Account Registration</h2>
            <p>
              To access certain features, you must create an account with a valid email address. You
              are responsible for maintaining the confidentiality of your account credentials and for
              all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">4. Purchases and Payments</h2>
            <p>All purchases are processed securely through Stripe. Available paid products include:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Individual book summaries at $0.99 per book</li>
              <li>Annual summary pass at $14.99/year for all 66 books</li>
              <li>AI verse explanation subscription</li>
            </ul>
            <p className="mt-2">
              Prices are displayed in USD and are subject to change. You will always see the current
              price before completing a purchase. Payment is collected at the time of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">5. Refund Policy</h2>
            <p>
              We offer refunds in accordance with our{" "}
              <Link href="/refunds" className="underline" style={{ color: "var(--accent)" }}>
                Refund Policy
              </Link>
              . Please review it before making a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">6. Content Disclaimer</h2>
            <p>
              The Bible text provided is the King James Version, which is in the public domain.
              AI-generated summaries and explanations are produced by machine learning models. While
              we strive for accuracy, AI-generated content may contain errors. These summaries are
              educational reading aids and should not be treated as authoritative theological
              commentary.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Reproduce, redistribute, or resell paid content</li>
              <li>Use automated systems to access the Service in a manner that exceeds reasonable use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">8. Intellectual Property</h2>
            <p>
              The King James Version Bible text is in the public domain. All other content,
              including AI-generated summaries, app design, and branding, is owned by BibleSummary.ai
              and protected by applicable intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">9. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at our discretion if you violate
              these terms. You may delete your account at any time by contacting us. Active
              subscriptions can be canceled from your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
              warranties of any kind, either express or implied. We do not guarantee that the
              Service will be uninterrupted, error-free, or free of harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">11. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, BibleSummary.ai shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your
              use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">12. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the Service after
              changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">13. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <strong>support@biblesummary.ai</strong>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
