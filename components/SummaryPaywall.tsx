"use client";

import Link from "next/link";

interface SummaryPaywallProps {
  bookName: string;
  isAuthenticated?: boolean;
}

/**
 * Respectful paywall explaining the value of book summaries.
 * No aggressive UX — gentle, informative presentation.
 */
export default function SummaryPaywall({
  bookName,
  isAuthenticated = false,
}: SummaryPaywallProps) {
  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <div
        className="rounded-xl p-6 text-center"
        style={{
          backgroundColor: "var(--card)",
          border: "0.5px solid var(--border)",
        }}
      >
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--foreground)" }}
        >
          Book Summary for {bookName}
        </h2>
        <p
          className="text-[14px] leading-relaxed mb-4 max-w-sm mx-auto"
          style={{ color: "var(--secondary)" }}
        >
          Understand what each book contains before or while you read — neutral,
          descriptive summaries with no interpretation or theology.
        </p>
        <p
          className="text-[13px] leading-relaxed mb-6"
          style={{ color: "var(--secondary)" }}
        >
          Book summaries are a paid feature that helps support this project.
          Bible text and audio remain always free.
        </p>
        {isAuthenticated ? (
          <p
            className="text-[13px] font-medium"
            style={{ color: "var(--secondary)" }}
          >
            Purchase options coming soon.
          </p>
        ) : (
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-full text-[14px] font-semibold transition-opacity active:opacity-80"
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
          >
            Sign in to unlock
          </Link>
        )}
      </div>
    </div>
  );
}
