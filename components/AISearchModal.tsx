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
  const lastAutoSearchRef = useRef("");

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
      lastAutoSearchRef.current = "";
    }
  }, [isOpen]);
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery !== lastAutoSearchRef.current) {
      setQuery(initialQuery);
      lastAutoSearchRef.current = initialQuery;
      // Small delay to let state settle
      setTimeout(() => handleSearch(initialQuery), 50);
    }
  }, [isOpen, initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doFetch(trimmed: string, token: string | null) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch("/api/bible-search", {
      method: "POST",
      headers,
      body: JSON.stringify({ query: trimmed }),
    });
  }

  async function getAccessToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function getFreshAccessToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.refreshSession();
    return session?.access_token ?? null;
  }

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
      let token = await getAccessToken();
      let res = await doFetch(trimmed, token);

      // If auth failed, refresh the token and retry once
      if (res.status === 401 || res.status === 403) {
        const retryData = await res.json().catch(() => ({}));
        if (retryData.code !== "PAYWALL") {
          token = await getFreshAccessToken();
          res = await doFetch(trimmed, token);
        }
      }

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
      setError("Search unavailable. Please try again later.");
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-5"
      style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          border: "0.5px solid var(--border)",
          maxWidth: "min(32rem, 100%)",
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
              {loading ? "Thinking\u2026" : "Search"}
            </button>
          </div>
        </form>

        {/* Content area */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-4"
          style={{ minHeight: 0 }}
        >
          {/* Loading — skeleton loader */}
          {loading && (
            <div className="py-4">
              <style>{`
                @keyframes skeletonPulse {
                  0%, 100% { opacity: 0.4; }
                  50% { opacity: 0.8; }
                }
              `}</style>
              {/* Skeleton AI answer card */}
              <div
                className="rounded-xl mb-3 p-4"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderLeftWidth: 3,
                  borderLeftColor: "var(--accent)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-[13px] h-[13px] rounded-full"
                    style={{ backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite" }}
                  />
                  <div
                    className="h-[10px] w-[60px] rounded-full"
                    style={{ backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", animationDelay: "0.1s" }}
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="h-[12px] rounded-full" style={{ backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "100%", animationDelay: "0.2s" }} />
                  <div className="h-[12px] rounded-full" style={{ backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "92%", animationDelay: "0.3s" }} />
                  <div className="h-[12px] rounded-full" style={{ backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "78%", animationDelay: "0.4s" }} />
                </div>
              </div>
              {/* Skeleton verse cards */}
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="rounded-xl px-3 py-2.5 mb-2"
                  style={{ backgroundColor: "var(--background)", border: "0.5px solid var(--border)" }}
                >
                  <div className="h-[11px] w-[90px] rounded-full mb-2" style={{ backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", animationDelay: `${0.5 + i * 0.2}s` }} />
                  <div className="h-[11px] rounded-full mb-1.5" style={{ backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "100%", animationDelay: `${0.6 + i * 0.2}s` }} />
                  <div className="h-[11px] rounded-full" style={{ backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "65%", animationDelay: `${0.7 + i * 0.2}s` }} />
                </div>
              ))}
              <p className="text-center text-[13px] mt-3" style={{ color: "var(--secondary)" }}>
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

          {/* Results — fade in */}
          {!loading && hasSearched && !error && (
            <div style={{ animation: "fadeInResults 0.3s ease-out" }}>
              <style>{`
                @keyframes fadeInResults {
                  from { opacity: 0; transform: translateY(6px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
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
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
