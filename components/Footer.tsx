import Link from "next/link";
import BrandName from "@/components/BrandName";

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
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" fill="none" style={{ height: 40, width: "auto" }} role="img" aria-label="ClearBible.ai Logo">
            <rect x="4" y="6" width="42" height="52" rx="6" fill="#7c5cfc"/>
            <path d="M8 54 L8 56 C8 58 10 60 12 60 L40 60 C42 60 44 58 44 56 L44 54" fill="#e8e4f0" stroke="#d4d0e0" strokeWidth="0.5"/>
            <path d="M8 52 L8 54 C8 56 10 58 12 58 L40 58 C42 58 44 56 44 54 L44 52" fill="#f0ecf8" stroke="#d4d0e0" strokeWidth="0.5"/>
            <rect x="22" y="16" width="6" height="28" rx="1.5" fill="#f0c040"/>
            <rect x="15" y="23" width="20" height="6" rx="1.5" fill="#f0c040"/>
            <text x="58" y="34" fontFamily="'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fontSize="26" fontWeight="700" fill="#2d2b4e">ClearBible<tspan fill="#7c5cfc">.ai</tspan></text>
            <text x="58" y="48" fontFamily="'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fontSize="9" fontWeight="400" fill="#8b87a0">AI Verse Explanations &amp; Chapter Summaries</text>
            <text x="58" y="59" fontFamily="'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fontSize="9" fontWeight="400" fill="#8b87a0">AI Bible Ask/Search Feature</text>
          </svg>
        </div>
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
          Contact: support@clearbible.ai
        </p>
        <p
          className="text-center text-[12px] mt-1"
          style={{ color: "var(--foreground-secondary)" }}
        >
          &copy; {new Date().getFullYear()} <BrandName />. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
