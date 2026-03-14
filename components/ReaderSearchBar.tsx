"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AISearchModal from "@/components/AISearchModal";

export default function ReaderSearchBar() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      className="sticky z-30 max-w-2xl mx-auto px-5 pt-3 pb-0"
      style={{ top: 50 }}
    >
      <style>{`
        @keyframes readerPulseGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(124, 92, 252, 0.08), 0 2px 8px rgba(124, 92, 252, 0.06); }
          50% { box-shadow: 0 0 18px rgba(124, 92, 252, 0.14), 0 2px 8px rgba(124, 92, 252, 0.1); }
        }
        .reader-search-pill {
          position: relative;
          border-radius: 50px;
          padding: 2px;
          background: linear-gradient(135deg, #7c5cfc, #a78bfa, #c4b5fd, #7c5cfc);
          animation: readerPulseGlow 3s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        .reader-search-pill:hover {
          box-shadow: 0 0 22px rgba(124, 92, 252, 0.2), 0 2px 10px rgba(124, 92, 252, 0.14);
        }
        .reader-search-inner {
          display: flex;
          align-items: center;
          width: 100%;
          border-radius: 48px;
          padding: 4px 4px 4px 16px;
          background: var(--card);
        }
      `}</style>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="reader-search-pill w-full active:scale-[0.99] transition-transform"
      >
        <div className="reader-search-inner">
          {/* Sparkle icon */}
          <span className="flex-shrink-0 flex items-center" style={{ color: "var(--accent)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
            </svg>
          </span>

          {/* Placeholder text */}
          <span
            className="flex-1 text-left text-[14px] py-2.5 px-3"
            style={{
              color: "var(--secondary)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Ask ClearBible AI...
          </span>

          {/* Ask AI button */}
          <span
            className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-bold"
            style={{
              background: "linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%)",
              color: "#fff",
              boxShadow: "0 2px 10px rgba(124, 92, 252, 0.3)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
            </svg>
            Ask AI
          </span>
        </div>
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
