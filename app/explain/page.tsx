"use client";

import Link from "next/link";
import { useVerseStore, getVerseId } from "@/lib/verseStore";
import ExplanationCard from "@/components/ExplanationCard";

export default function ExplainPage() {
  const {
    selectedVerse,
    explanation,
    explainStatus,
    setExplanation,
    setExplainStatus,
    addToCache,
    getFromCache,
  } = useVerseStore();

  async function handleExplain() {
    if (!selectedVerse) return;

    const verseId = getVerseId(
      selectedVerse.book,
      selectedVerse.chapter,
      selectedVerse.verse
    );

    // Check local cache first
    const cached = getFromCache(verseId);
    if (cached) {
      setExplanation(cached.text);
      setExplainStatus("success");
      return;
    }

    setExplainStatus("loading");

    try {
      const response = await fetch("/api/explain-verse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book: selectedVerse.book,
          chapter: selectedVerse.chapter,
          verse: selectedVerse.verse,
          verseText: selectedVerse.text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch explanation");
      }

      const data = await response.json();

      if (data.explanation) {
        setExplanation(data.explanation);
        setExplainStatus("success");
        addToCache(verseId, data.explanation);
      } else {
        throw new Error("No explanation received");
      }
    } catch (error) {
      console.error("Explain error:", error);
      setExplainStatus("error");
    }
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--background-blur)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <h1
          className="text-[17px] font-semibold text-center max-w-lg mx-auto"
          style={{ color: "var(--foreground)" }}
        >
          Explain
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {!selectedVerse ? (
          // No verse selected
          <div className="py-16 text-center">
            <div
              className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "var(--card)",
                border: "0.5px solid var(--border)",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "#c4a574" }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2
              className="text-[17px] font-semibold mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Select a verse to explain
            </h2>
            <p
              className="text-[13px] leading-relaxed mb-6"
              style={{ color: "var(--secondary)" }}
            >
              Tap any verse while reading, then return here to get a plain
              English explanation.
            </p>
            <Link
              href="/bible"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#c4a574" }}
            >
              Start Reading
            </Link>
          </div>
        ) : (
          // Verse selected
          <div>
            {/* Selected verse card */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{
                backgroundColor: "var(--card)",
                border: "0.5px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: "#c4a574" }}
                >
                  {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                </span>
                <Link
                  href={`/bible/${selectedVerse.bookSlug}/${selectedVerse.chapter}?verse=${selectedVerse.verse}`}
                  className="text-[12px] font-medium"
                  style={{ color: "var(--secondary)" }}
                >
                  View in context →
                </Link>
              </div>
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: "var(--foreground)" }}
              >
                &ldquo;{selectedVerse.text}&rdquo;
              </p>
            </div>

            {/* Explanation section */}
            {explainStatus === "success" && explanation ? (
              <ExplanationCard
                explanation={explanation}
                onClose={() => {
                  setExplanation(null);
                  setExplainStatus("idle");
                }}
              />
            ) : explainStatus === "loading" ? (
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: "0.5px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: "var(--border)",
                      borderTopColor: "#c4a574",
                    }}
                  />
                  <span
                    className="text-[14px]"
                    style={{ color: "var(--secondary)" }}
                  >
                    Generating explanation...
                  </span>
                </div>
              </div>
            ) : explainStatus === "error" ? (
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: "0.5px solid var(--border)",
                }}
              >
                <p
                  className="text-[14px] mb-3"
                  style={{ color: "var(--foreground)" }}
                >
                  Explanation unavailable.
                </p>
                <button
                  onClick={handleExplain}
                  className="text-[13px] font-medium"
                  style={{ color: "#c4a574" }}
                >
                  Try again
                </button>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Explain button - only show when verse selected and idle */}
      {selectedVerse && explainStatus === "idle" && (
        <div className="fixed bottom-20 right-4 z-30">
          <button
            onClick={handleExplain}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-[14px] font-semibold text-white shadow-lg active:scale-95 transition-transform"
            style={{
              backgroundColor: "#c4a574",
              minHeight: "44px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Explain this verse
          </button>
        </div>
      )}
    </div>
  );
}
