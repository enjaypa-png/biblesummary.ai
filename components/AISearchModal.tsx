"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface SearchVerse {
  book_id: string;
  book_name: string;
  book_slug: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVerse?: (slug: string, chapter: number, verse: number) => void;
  initialQuery?: string;
}

export default function AISearchModal({
  isOpen,
  onClose,
  onSelectVerse,
  initialQuery = "",
}: AISearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [verses, setVerses] = useState<SearchVerse[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      // Reset state when modal closes
      setError(null);
      setAnswer(null);
      setVerses([]);
      setHasSearched(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Update query if initialQuery changes while open
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  async function handleSearch(searchQuery?: string) {
    const trimmed = (searchQuery || query).trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setAnswer(null);
    setVerses([]);
    setHasSearched(true);

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/bible-search", {
        method: "POST",
        headers,
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "PAYWALL") {
          setError(
            "AI Bible Search is a premium feature. Please upgrade to access."
          );
        } else {
          throw new Error("Search failed");
        }
        return;
      }

      const data = await res.json();
      setAnswer(data.answer || null);
      setVerses(Array.isArray(data.verses) ? data.verses : []);
    } catch {
      setError("Search unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch();
  }

  function handleVerseClick(v: SearchVerse) {
    if (onSelectVerse && v.book_slug) {
      onSelectVerse(v.book_slug, v.chapter, v.verse);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          border: "0.5px solid var(--border)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--accent)" }}>
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <span
              className="text-[15px] font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              AI Bible Search
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-medium px-2 py-1"
            style={{ color: "var(--secondary)" }}
          >
            Close
          </button>
        </div>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="px-4 pb-3 flex-shrink-0">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-1"
            style={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="flex-shrink-0 text-[14px]"
              style={{ color: "var(--accent)" }}
            >
              &#10022;
            </span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about the Bible..."
              className="flex-1 bg-transparent border-none outline-none py-2.5 text-[14px]"
              style={{
                color: "var(--foreground)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-opacity"
              style={{
                backgroundColor: "var(--accent)",
                color: "#fff",
                opacity: loading || !query.trim() ? 0.5 : 1,
              }}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </form>

        {/* Content area */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-4"
          style={{ minHeight: 0 }}
        >
          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div
                className="inline-block w-6 h-6 border-2 rounded-full animate-spin mb-2"
                style={{
                  borderColor: "var(--border)",
                  borderTopColor: "var(--accent)",
                }}
              />
              <p
                className="text-[13px]"
                style={{ color: "var(--secondary)" }}
              >
                Searching the Bible...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              className="px-3 py-2.5 rounded-xl text-[13px] mb-3"
              style={{
                backgroundColor: "rgba(192, 57, 43, 0.08)",
                color: "#c0392b",
              }}
            >
              {error}
            </div>
          )}

          {/* Results */}
          {!loading && hasSearched && !error && (
            <>
              {/* AI Answer */}
              {answer && (
                <div
                  className="rounded-xl mb-3 p-4"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderLeftWidth: 3,
                    borderLeftColor: "var(--accent)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="var(--accent)"
                    >
                      <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
                    </svg>
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--accent)" }}
                    >
                      AI Answer
                    </span>
                  </div>
                  <p
                    className="text-[14px] leading-relaxed m-0"
                    style={{
                      color: "var(--foreground)",
                      lineHeight: 1.7,
                    }}
                  >
                    {answer}
                  </p>
                </div>
              )}

              {/* Supporting verses */}
              {verses.length > 0 && (
                <div>
                  <p
                    className="text-[11px] font-bold uppercase tracking-wider mb-2"
                    style={{
                      color: "var(--secondary)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Supporting Verses
                  </p>
                  <div className="flex flex-col gap-2">
                    {verses.map((v, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleVerseClick(v)}
                        className="w-full text-left rounded-xl px-3 py-2.5 active:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: "var(--background)",
                          border: "0.5px solid var(--border)",
                        }}
                      >
                        <div
                          className="text-[13px] font-semibold mb-1"
                          style={{ color: "var(--accent)" }}
                        >
                          {v.reference}
                        </div>
                        <p
                          className="text-[13px] m-0 leading-relaxed"
                          style={{ color: "var(--foreground)", lineHeight: 1.6 }}
                        >
                          {v.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {!answer && verses.length === 0 && (
                <div className="text-center py-8">
                  <p
                    className="text-[13px]"
                    style={{ color: "var(--secondary)" }}
                  >
                    No results found. Try rephrasing your question.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Empty state before search */}
          {!loading && !hasSearched && !error && (
            <div className="py-4">
              <p
                className="text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{
                  color: "var(--secondary)",
                  letterSpacing: "0.08em",
                }}
              >
                Try asking
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  "Who was King David?",
                  "What does the Bible say about anxiety?",
                  "Why did God flood the earth?",
                  "Who was Samson?",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setQuery(q);
                      handleSearch(q);
                    }}
                    className="text-left px-3 py-2.5 rounded-xl text-[13px] active:opacity-70 transition-opacity"
                    style={{
                      backgroundColor: "var(--background)",
                      border: "0.5px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
