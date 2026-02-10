"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabase";

interface BookSummaryButtonProps {
  bookId: string;
  bookSlug: string;
  bookName: string;
}

export default function BookSummaryButton({
  bookId,
  bookSlug,
  bookName,
}: BookSummaryButtonProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAccess() {
      const user = await getCurrentUser();
      if (!user) {
        setHasAccess(false);
        return;
      }

      const { data, error } = await supabase.rpc("user_has_summary_access", {
        p_user_id: user.id,
        p_book_id: bookId,
      });

      setHasAccess(!error && data === true);
    }
    checkAccess();
  }, [bookId]);

  function handleClick() {
    // Always navigate to summary page — it handles its own paywall
    router.push(`/bible/${bookSlug}/summary`);
  }

  const isLocked = hasAccess === false;

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-medium transition-all active:scale-[0.98]"
      style={{
        backgroundColor: isLocked ? "var(--card)" : "var(--accent)",
        color: isLocked ? "var(--secondary)" : "#ffffff",
        border: isLocked ? "0.5px solid var(--border)" : "none",
        opacity: isLocked ? 0.7 : 1,
      }}
    >
      {/* Lock or document icon */}
      {isLocked ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
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
      )}
      {isLocked ? "Book Summary" : `Read ${bookName} Summary`}
    </button>
  );
}
