"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AISearchInput, { AISearchInputRef } from "@/components/AISearchInput";
import AISearchLoading from "@/components/AISearchLoading";
import AISearchResponseCard from "@/components/AISearchResponseCard";

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
  const [activeQuestion, setActiveQuestion] = useState("");
  const [verses, setVerses] = useState<SearchVerse[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const searchRef = useRef<AISearchInputRef>(null);
  const lastAutoSearchRef = useRef("");

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setError(null);
      setAnswer(null);
      setVerses([]);
      setHasSearched(false);
      setLoading(false);
      setActiveQuestion("");
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
    setActiveQuestion(trimmed);
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

  function handleVerseClick(reference: string) {
    // Find matching verse from results
    const v = verses.find((vs) => vs.reference === reference);
    if (v && onSelectVerse && v.book_slug) {
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
        .ai-modal-card {
          animation: modalSlideIn 0.25s ease-out;
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
        <div className="px-5 pt-3 pb-4 flex-shrink-0">
          <AISearchInput
            ref={searchRef}
            value={query}
            onChange={setQuery}
            onSubmit={() => handleSearch()}
            loading={loading}
            placeholder="Ask anything about the Bible..."
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginLeft: 20, marginRight: 20, flexShrink: 0 }} />

        {/* Content area */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{ minHeight: 0 }}
        >
          {/* Loading */}
          {loading && <AISearchLoading />}

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

          {/* Results */}
          {!loading && hasSearched && !error && answer && (
            <AISearchResponseCard
              question={activeQuestion}
              answer={answer}
              verses={verses.map((v) => ({ reference: v.reference, text: v.text }))}
              onVerseClick={handleVerseClick}
            />
          )}

          {/* No results */}
          {!loading && hasSearched && !error && !answer && verses.length === 0 && (
            <AISearchResponseCard
              question={activeQuestion}
              answer=""
              verses={[]}
            />
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
