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
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function getFreshAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.refreshSession();
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
          setError("AI Bible Search is a premium feature. Please upgrade to access.");
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
      className="fixed inset-0 z-50 flex items-start justify-center px-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        paddingTop: "8vh",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.7; }
        }
        @keyframes fadeInResults {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        .ai-modal-card {
          animation: modalSlideIn 0.25s ease-out;
        }
        .ai-modal-search-wrap {
          position: relative;
          border-radius: 50px;
          padding: 2px;
          background: linear-gradient(135deg, #7c5cfc, #a78bfa, #c4b5fd, #7c5cfc);
        }
        .ai-modal-search-inner {
          display: flex;
          align-items: center;
          border-radius: 48px;
          padding: 3px 4px 3px 16px;
          background: var(--card);
        }
      `}</style>

      <div
        className="ai-modal-card w-full overflow-hidden"
        style={{
          maxWidth: "min(36rem, 100%)",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 24,
          background: "var(--background)",
          border: "1px solid var(--border)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2), 0 8px 24px rgba(124,92,252,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-1 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
              </svg>
            </div>
            <div>
              <span
                className="text-[15px] font-bold block"
                style={{ color: "var(--foreground)", fontFamily: "'DM Sans', sans-serif" }}
              >
                AI Bible Search
              </span>
              <span
                className="text-[11px] font-medium"
                style={{ color: "var(--secondary)", fontFamily: "'DM Sans', sans-serif" }}
              >
                Ask anything about the Bible
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-opacity active:opacity-60"
            style={{
              width: 32,
              height: 32,
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="px-5 pt-3 pb-4 flex-shrink-0">
          <div className="ai-modal-search-wrap">
            <div className="ai-modal-search-inner">
              <span className="flex-shrink-0 flex items-center" style={{ color: "var(--accent)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
                </svg>
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about the Bible..."
                className="flex-1 bg-transparent border-none outline-none py-2.5 px-3 text-[14px]"
                style={{
                  color: "var(--foreground)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full text-[13px] font-bold transition-all"
                style={{
                  padding: "9px 20px",
                  background: loading || !query.trim()
                    ? "var(--border)"
                    : "linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%)",
                  color: "#fff",
                  boxShadow: loading || !query.trim()
                    ? "none"
                    : "0 2px 10px rgba(124, 92, 252, 0.3)",
                  opacity: loading || !query.trim() ? 0.6 : 1,
                  cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                  border: "none",
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spinLoader 0.7s linear infinite",
                      }}
                    />
                    Thinking...
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
                    </svg>
                    Ask AI
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginLeft: 20, marginRight: 20, flexShrink: 0 }} />

        {/* Content area */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{ minHeight: 0 }}
        >
          {/* Loading — skeleton loader */}
          {loading && (
            <div>
              {/* Skeleton AI answer card */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: 16,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid var(--accent)",
                  marginBottom: 14,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite" }}
                  />
                  <div
                    style={{ height: 10, width: 70, borderRadius: 99, backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", animationDelay: "0.1s" }}
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <div style={{ height: 12, borderRadius: 99, backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "100%", animationDelay: "0.15s" }} />
                  <div style={{ height: 12, borderRadius: 99, backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "88%", animationDelay: "0.25s" }} />
                  <div style={{ height: 12, borderRadius: 99, backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "72%", animationDelay: "0.35s" }} />
                </div>
              </div>
              {/* Skeleton verse cards */}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--secondary)", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ height: 9, width: 110, borderRadius: 99, backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", animationDelay: "0.4s" }} />
              </div>
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ height: 11, width: 100, borderRadius: 99, backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", marginBottom: 10, animationDelay: `${0.5 + i * 0.15}s` }} />
                  <div style={{ height: 11, borderRadius: 99, backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "100%", marginBottom: 6, animationDelay: `${0.6 + i * 0.15}s` }} />
                  <div style={{ height: 11, borderRadius: 99, backgroundColor: "var(--border)", animation: "skeletonPulse 1.5s ease-in-out infinite", width: "60%", animationDelay: `${0.7 + i * 0.15}s` }} />
                </div>
              ))}
              <p
                className="text-center text-[13px] mt-4 font-medium"
                style={{ color: "var(--secondary)", fontFamily: "'DM Sans', sans-serif" }}
              >
                Searching the Bible...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 14,
                background: "rgba(220, 38, 38, 0.06)",
                border: "1px solid rgba(220, 38, 38, 0.12)",
                fontSize: 14,
                color: "#dc2626",
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {/* Results — fade in */}
          {!loading && hasSearched && !error && (
            <div style={{ animation: "fadeInResults 0.3s ease-out" }}>
              {/* AI Answer */}
              {answer && (
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: 16,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderLeft: "3px solid var(--accent)",
                    marginBottom: 16,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)">
                      <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
                    </svg>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      AI Answer
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.75,
                      color: "var(--foreground)",
                      margin: 0,
                      fontFamily: "'DM Sans', sans-serif",
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
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--secondary)",
                      marginBottom: 10,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Supporting Verses
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {verses.map((v, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleVerseClick(v)}
                        className="w-full text-left active:scale-[0.99] transition-all"
                        style={{
                          padding: "14px 16px",
                          borderRadius: 14,
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--accent)",
                            marginBottom: 5,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {v.reference}
                        </div>
                        <p
                          style={{
                            fontSize: 14,
                            margin: 0,
                            color: "var(--foreground)",
                            lineHeight: 1.65,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
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
                    style={{
                      fontSize: 14,
                      color: "var(--secondary)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    No results found. Try rephrasing your question.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty state — before first search */}
          {!loading && !hasSearched && !error && (
            <div className="text-center py-6">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  margin: "0 0 4px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Ask a question about the Bible
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--secondary)",
                  margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.5,
                }}
              >
                Get AI-powered answers with supporting verses
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
