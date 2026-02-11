import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="w-full border-t px-5 py-6"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-lg mx-auto">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px]">
          <Link href="/pricing" style={{ color: "var(--accent)" }} className="hover:underline">
            Pricing
          </Link>
          <Link href="/terms" style={{ color: "var(--accent)" }} className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" style={{ color: "var(--accent)" }} className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/refunds" style={{ color: "var(--accent)" }} className="hover:underline">
            Refund Policy
          </Link>
        </div>
        <p
          className="text-center text-[12px] mt-3"
          style={{ color: "var(--foreground-secondary)" }}
        >
          Contact: support@biblesummary.ai
        </p>
        <p
          className="text-center text-[12px] mt-1"
          style={{ color: "var(--foreground-secondary)" }}
        >
          &copy; {new Date().getFullYear()} BibleSummary.ai. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
