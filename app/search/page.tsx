"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { getCurrentUser, supabase } from "@/lib/supabase";
import { startCheckout } from "@/lib/entitlements";

interface SearchVerse {
  book_id: string;
  book_name: string;
  book_slug: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

const EXAMPLE_QUESTIONS = [
  "Who was Samson?",
  "Why did Judas betray Jesus?",
  "What does the Bible say about anxiety?",
  "Why did God flood the earth?",
  "What is faith according to the Bible?",
  "Who was King David?",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [verses, setVerses] = useState<SearchVerse[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Auth + entitlement state
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
      if (!user) {
        setAuthChecked(true);
        return;
      }

      // Check if user has premium/explain access (AI Bible Search is bundled with premium)
      const { data: explainAccess } = await supabase.rpc("user_has_explain_access", {
        p_user_id: user.id,
      });

      if (explainAccess === true) {
        setHasAccess(true);
        setAuthChecked(true);
        return;
      }

      // Fallback: check via API (Stripe verification)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch("/api/check-access", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({}),
          });
          if (res.ok) {
            const result = await res.json();
            if (result.hasExplainAccess) {
              setHasAccess(true);
            }
          }
        }
      } catch {
        // Stripe fallback failed
      }

      setAuthChecked(true);
    }

    checkAccess();
  }, []);

  async function handleSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // Check paywall
    if (!hasAccess) {
      setShowPaywall(true);
      return;
    }

    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setAnswer(null);
    setVerses([]);
    setHasSearched(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/bible-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!res.ok) {
        throw new Error("Search failed");
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleSearch(query);
  }

  async function handleUpgrade() {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent("/search")}`;
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    const { url, error: err } = await startCheckout({
      product: "premium_annual",
      returnPath: "/pricing/success",
    });

    if (err) {
      setCheckoutError(err);
      setCheckoutLoading(false);
      return;
    }

    if (url) {
      window.location.href = url;
    } else {
      setCheckoutError("Unable to start checkout. Please try again.");
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--background)" }}>
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
          AI Bible Search
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {/* Search input */}
        <form onSubmit={handleSubmit} className="relative mb-5">
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-1"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <svg
              width="18"
              height="18"
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
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about the Bible..."
              className="flex-1 bg-transparent border-none outline-none py-3 text-[15px]"
              style={{
                color: "var(--foreground)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold transition-opacity"
              style={{
                backgroundColor: "var(--accent)",
                color: "#fff",
                opacity: loading || !query.trim() ? 0.5 : 1,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {loading ? "..." : "Ask"}
            </button>
          </div>
        </form>

        {/* Premium badge for free users */}
        {authChecked && !hasAccess && (
          <div
            className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: "var(--accent-light, rgba(124, 92, 252, 0.08))",
              border: "1px solid var(--accent-border, rgba(124, 92, 252, 0.2))",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)" className="flex-shrink-0">
              <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
            </svg>
            <span
              className="text-[13px] font-medium"
              style={{ color: "var(--accent)", fontFamily: "'DM Sans', sans-serif" }}
            >
              AI Bible Search is a premium feature.{" "}
              <button
                onClick={() => setShowPaywall(true)}
                className="underline font-semibold"
                style={{ color: "var(--accent)" }}
              >
                Upgrade to unlock
              </button>
            </span>
          </div>
        )}

        {/* Example questions (shown before any search) */}
        {!hasSearched && !loading && (
          <div>
            <p
              className="text-[12px] font-bold uppercase tracking-wider mb-3"
              style={{
                color: "var(--secondary)",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              Try asking
            </p>
            <div className="flex flex-col gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSearch(q)}
                  className="text-left px-4 py-3 rounded-xl text-[14px] transition-colors"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div
              className="inline-block w-8 h-8 border-2 rounded-full animate-spin mb-3"
              style={{
                borderColor: "var(--border)",
                borderTopColor: "var(--accent)",
              }}
            />
            <p
              className="text-[14px]"
              style={{
                color: "var(--secondary)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Searching the Bible...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-[13px] mb-4"
            style={{
              backgroundColor: "rgba(192, 57, 43, 0.08)",
              color: "#c0392b",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && !error && (
          <div>
            {/* AI Answer */}
            {answer && (
              <div
                className="rounded-2xl mb-4 p-5"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderLeftWidth: 3,
                  borderLeftColor: "var(--accent)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="var(--accent)"
                  >
                    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
                  </svg>
                  <span
                    className="text-[12px] font-bold uppercase tracking-wider"
                    style={{
                      color: "var(--accent)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    AI Answer
                  </span>
                </div>
                <p
                  className="text-[15px] leading-relaxed m-0"
                  style={{
                    color: "var(--foreground)",
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.75,
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
                  className="text-[11px] font-bold uppercase tracking-wider mb-3"
                  style={{
                    color: "var(--secondary)",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.08em",
                  }}
                >
                  Supporting Verses
                </p>
                <div className="flex flex-col gap-2">
                  {verses.map((v, idx) => (
                    <Link
                      key={idx}
                      href={`/bible/${encodeURIComponent(v.book_slug)}/${v.chapter}?verse=${v.verse}`}
                      className="block no-underline"
                    >
                      <div
                        className="px-4 py-3 rounded-xl transition-colors"
                        style={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          className="text-[13px] font-semibold mb-1"
                          style={{
                            color: "var(--accent)",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {v.reference}
                        </div>
                        <p
                          className="text-[13px] m-0 leading-relaxed"
                          style={{
                            color: "var(--foreground)",
                            lineHeight: 1.6,
                          }}
                        >
                          {v.text}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {!answer && verses.length === 0 && (
              <div className="text-center py-12">
                <p
                  className="text-[14px]"
                  style={{
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
      </main>

      {/* Paywall modal */}
      {showPaywall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPaywall(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-center mb-4">
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--accent-light, rgba(124, 92, 252, 0.1))" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
            </div>

            <h3
              className="text-[18px] font-bold text-center mb-2"
              style={{ color: "var(--foreground)", fontFamily: "'DM Sans', sans-serif" }}
            >
              AI Bible Search
            </h3>
            <p
              className="text-[14px] text-center leading-relaxed mb-5"
              style={{ color: "var(--foreground-secondary)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Ask any Bible question and get an instant AI-powered answer with supporting verses. This is a premium feature included with ClearBible Unlimited.
            </p>

            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-left transition-all active:scale-[0.98] disabled:opacity-60 mb-2"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              <span>
                <span className="block text-[15px] font-semibold">
                  {isAuthenticated ? "Upgrade to Unlimited" : "Sign in to get started"}
                </span>
                <span className="block text-[12px] opacity-80">
                  AI Bible Search + explanations + summaries + audio
                </span>
              </span>
              <span className="text-[16px] font-bold">
                {checkoutLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isAuthenticated ? (
                  "$79/yr"
                ) : (
                  "Free"
                )}
              </span>
            </button>

            {checkoutError && (
              <p className="text-[13px] text-center mt-2" style={{ color: "var(--error)" }}>
                {checkoutError}
              </p>
            )}

            <button
              onClick={() => setShowPaywall(false)}
              className="w-full py-2.5 mt-2 text-[14px] font-medium rounded-xl"
              style={{ color: "var(--secondary)" }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
