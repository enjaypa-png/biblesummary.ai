"use client";

import { useRouter } from "next/navigation";

export default function ReaderSearchBar() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto px-5 pt-3 pb-0">
      <button
        type="button"
        onClick={() => router.push("/search")}
        className="flex items-center gap-2 w-full rounded-full px-4 py-2.5 transition-colors"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span
          className="text-[14px]"
          style={{
            color: "var(--secondary)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Search
        </span>
      </button>
    </div>
  );
}
