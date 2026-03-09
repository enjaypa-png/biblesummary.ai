"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AISearchModal from "@/components/AISearchModal";

export default function ReaderSearchBar() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-3 pb-0">
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center w-full rounded-2xl px-4 py-3 transition-all active:scale-[0.99]"
        style={{
          backgroundColor: "var(--card)",
          border: "1.5px solid var(--accent)",
          boxShadow: "0 2px 12px rgba(124, 92, 252, 0.12)",
        }}
      >
        {/* Sparkle icon */}
        <span
          className="flex-shrink-0 text-[14px] mr-2.5"
          style={{ color: "var(--accent)" }}
        >
          &#10022;
        </span>

        {/* Placeholder text */}
        <span
          className="flex-1 text-left text-[14px]"
          style={{
            color: "var(--secondary)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Ask ClearBible AI...
        </span>

        {/* Ask AI button */}
        <span
          className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-[12px] font-bold"
          style={{
            backgroundColor: "var(--accent)",
            color: "#fff",
          }}
        >
          Ask AI
        </span>
      </button>

      <AISearchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectVerse={(slug, chapter, verse) => {
          router.push(`/bible/${slug}/${chapter}?verse=${verse}`);
        }}
      />
    </div>
  );
}
