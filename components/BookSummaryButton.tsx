"use client";

import { useRouter } from "next/navigation";

interface BookSummaryButtonProps {
  bookId: string;
  bookSlug: string;
  bookName: string;
}

export default function BookSummaryButton({
  bookSlug,
  bookName,
}: BookSummaryButtonProps) {
  const router = useRouter();

  function handleClick() {
    // Always navigate to summary page — it handles its own paywall
    router.push(`/bible/${bookSlug}/summary`);
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-medium transition-all active:scale-[0.98]"
      style={{
        backgroundColor: "var(--card)",
        color: "var(--foreground)",
        border: "0.5px solid var(--border)",
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
      {bookName} Summary
    </button>
  );
}
