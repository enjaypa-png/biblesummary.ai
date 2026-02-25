import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy - ClearBible.ai",
  description: "Privacy Policy for ClearBible.ai",
};

export default function PrivacyPage() {
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
            Privacy Policy
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
            <h2 className="text-[17px] font-semibold mb-2">1. Information We Collect</h2>
            <p>When you use ClearBible.ai, we may collect:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>
                <strong>Account information:</strong> Email address and authentication credentials
                when you create an account
              </li>
              <li>
                <strong>Purchase information:</strong> Transaction records for paid features
                (payment details are handled directly by Stripe and are not stored on our servers)
              </li>
              <li>
                <strong>Usage data:</strong> Reading progress, bookmarks, notes, and feature usage
                to provide and improve the Service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Provide and maintain the Service</li>
              <li>Process purchases and manage subscriptions</li>
              <li>Save your reading progress, bookmarks, and notes</li>
              <li>Improve the Service and fix issues</li>
              <li>Communicate with you about your account or purchases</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal information. We do not use your data for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">3. Third-Party Services</h2>
            <p>We use the following third-party services to operate ClearBible.ai:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>
                <strong>Supabase:</strong> Authentication and database hosting
              </li>
              <li>
                <strong>Stripe:</strong> Payment processing — Stripe handles all payment card data
                securely. We never see or store your full card number.
              </li>
              <li>
                <strong>ElevenLabs:</strong> Text-to-speech audio generation
              </li>
              <li>
                <strong>OpenAI:</strong> AI-generated verse explanations
              </li>
              <li>
                <strong>Vercel:</strong> Application hosting
              </li>
            </ul>
            <p className="mt-2">
              Each third-party service has its own privacy policy governing how they handle data.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard practices. Authentication is
              handled through Supabase with encrypted connections. We use HTTPS for all data
              transmission.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">5. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you request
              account deletion, we will remove your personal data within 30 days, except where
              retention is required for legal or financial record-keeping purposes.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Cancel subscriptions at any time from your account settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">7. Cookies and Local Storage</h2>
            <p>
              ClearBible.ai uses browser local storage to save your reading position and
              preferences. We use authentication tokens to keep you signed in. We do not use
              third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">8. Children&apos;s Privacy</h2>
            <p>
              ClearBible.ai is not directed at children under 13. We do not knowingly collect
              personal information from children under 13. If you believe a child has provided us
              with personal information, please contact us so we can remove it.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of
              significant changes by updating the &ldquo;Last updated&rdquo; date at the top of
              this page.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold mb-2">10. Contact</h2>
            <p>
              For privacy-related questions or data requests, contact us at{" "}
              <strong>support@clearbible.ai</strong>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
