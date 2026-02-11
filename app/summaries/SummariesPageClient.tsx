"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { startCheckout } from "@/lib/entitlements";

interface Book {
  id: string;
  name: string;
  slug: string;
  testament: string;
  order_index: number;
}

interface Purchase {
  book_id: string;
  type: string;
}

export default function SummariesPageClient({ books }: { books: Book[] }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasedBookIds, setPurchasedBookIds] = useState<Set<string>>(new Set());
  const [hasAnnualPass, setHasAnnualPass] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPurchases() {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);

      if (!user) {
        setLoading(false);
        return;
      }

      // Check for individual purchases
      const { data: purchases } = await supabase
        .from("purchases")
        .select("book_id, type")
        .eq("user_id", user.id);

      const ownedIds = new Set<string>();
      let hasLifetime = false;

      if (purchases) {
        for (const p of purchases as Purchase[]) {
          if (p.type === "lifetime") {
            hasLifetime = true;
          }
          if (p.book_id) {
            ownedIds.add(p.book_id);
          }
        }
      }

      // Check for annual subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .eq("type", "summary_annual")
        .maybeSingle();

      const hasActiveSub = sub &&
        (sub.status === "active" || sub.status === "canceled") &&
        new Date(sub.current_period_end) > new Date();

      setHasAnnualPass(hasLifetime || !!hasActiveSub);
      setPurchasedBookIds(ownedIds);
      setLoading(false);
    }

    loadPurchases();
  }, []);

  async function handleCheckout(product: "summary_single" | "summary_annual", book?: Book) {
    setError(null);
    const key = product === "summary_annual" ? "annual" : book?.id || "";
    setCheckoutLoading(key);

    const params: Parameters<typeof startCheckout>[0] = {
      product,
      returnPath: book ? `/summaries/${book.slug}` : "/summaries",
    };
    if (book) {
      params.bookId = book.id;
      params.bookSlug = book.slug;
    }

    const result = await startCheckout(params);
    if (result.error) {
      setError(result.error);
      setCheckoutLoading(null);
    } else if (result.url) {
      window.location.href = result.url;
    }
  }

  const ownedBooks = books.filter((b) => hasAnnualPass || purchasedBookIds.has(b.id));
  const availableBooks = books.filter((b) => !hasAnnualPass && !purchasedBookIds.has(b.id));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
      >
        <h1
          className="text-[18px] font-bold text-center max-w-lg mx-auto"
          style={{ color: "var(--foreground)" }}
        >
          Book Summaries
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-5 py-5 pb-24">
        {/* Description */}
        <p
          className="text-[14px] leading-relaxed mb-5"
          style={{ color: "var(--secondary)" }}
        >
          Detailed, faithful summaries of every book — helping you retain
          what you read across months of study.
        </p>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-[14px]"
            style={{ backgroundColor: "var(--error-bg, #fef2f2)", color: "var(--error, #dc2626)" }}
          >
            {error}
          </div>
        )}

        {/* Annual Pass CTA */}
        {!loading && isAuthenticated && !hasAnnualPass && (
          <div
            className="mb-6 p-5 rounded-2xl"
            style={{ backgroundColor: "var(--accent)", position: "relative", overflow: "hidden" }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-[13px] font-bold text-white/80 uppercase tracking-wider">
                  Best Value
                </span>
              </div>
              <h2 className="text-[20px] font-bold text-white mb-1">
                All 66 Book Summaries
              </h2>
              <p className="text-[14px] text-white/80 mb-4 leading-relaxed">
                Get every summary for just $14.99/year — less than 23 cents per book.
              </p>
              <button
                onClick={() => handleCheckout("summary_annual")}
                disabled={checkoutLoading === "annual"}
                className="w-full py-3 rounded-xl text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-70"
                style={{ backgroundColor: "white", color: "var(--accent)" }}
              >
                {checkoutLoading === "annual" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Subscribe — $14.99/year"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Annual Pass Active Banner */}
        {!loading && hasAnnualPass && (
          <div
            className="mb-6 p-4 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: "var(--card)", border: "1.5px solid var(--accent)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>
                All Summaries Unlocked
              </p>
              <p className="text-[13px]" style={{ color: "var(--secondary)" }}>
                Your annual pass gives you access to every book summary.
              </p>
            </div>
          </div>
        )}

        {/* Not authenticated CTA */}
        {!loading && !isAuthenticated && (
          <div
            className="mb-6 p-5 rounded-2xl text-center"
            style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3" style={{ color: "var(--accent)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              Sign in to purchase summaries
            </p>
            <p className="text-[13px] mb-4" style={{ color: "var(--secondary)" }}>
              Buy individual books for $0.99 each or get all 66 for $14.99/year.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Sign In
            </Link>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
            />
          </div>
        ) : (
          <>
            {/* YOUR LIBRARY section */}
            {ownedBooks.length > 0 && (
              <div className="mb-6">
                <h2 className="text-[13px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--accent)" }}>
                  Your Library ({ownedBooks.length})
                </h2>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
                >
                  {ownedBooks.map((book, i) => (
                    <Link
                      key={book.id}
                      href={`/summaries/${book.slug}`}
                      className="flex items-center justify-between px-4 py-3.5 active:opacity-70 transition-opacity"
                      style={{
                        borderBottom: i < ownedBooks.length - 1 ? "0.5px solid var(--border)" : "none",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5" className="flex-shrink-0">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-[16px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                          {book.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span
                          className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--accent)", color: "white" }}
                        >
                          Owned
                        </span>
                        <svg width="5" height="9" viewBox="0 0 6 10" fill="none">
                          <path d="M1 1L5 5L1 9" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* AVAILABLE section */}
            {availableBooks.length > 0 && (
              <div className="mb-6">
                <h2 className="text-[13px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--secondary)" }}>
                  Available ({availableBooks.length})
                </h2>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
                >
                  {availableBooks.map((book, i) => (
                    <div
                      key={book.id}
                      className="flex items-center justify-between px-4 py-3.5"
                      style={{
                        borderBottom: i < availableBooks.length - 1 ? "0.5px solid var(--border)" : "none",
                      }}
                    >
                      <Link
                        href={`/summaries/${book.slug}`}
                        className="flex-1 min-w-0 active:opacity-70"
                      >
                        <span className="text-[16px] font-semibold truncate block" style={{ color: "var(--foreground)" }}>
                          {book.name}
                        </span>
                        <span className="text-[12px]" style={{ color: "var(--secondary)" }}>
                          {book.testament} Testament
                        </span>
                      </Link>
                      {isAuthenticated ? (
                        <button
                          onClick={() => handleCheckout("summary_single", book)}
                          disabled={checkoutLoading === book.id}
                          className="flex-shrink-0 ml-3 px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all active:scale-95 disabled:opacity-60"
                          style={{
                            backgroundColor: "var(--accent)",
                            color: "white",
                          }}
                        >
                          {checkoutLoading === book.id ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                          ) : (
                            "$0.99"
                          )}
                        </button>
                      ) : (
                        <span
                          className="flex-shrink-0 ml-3 text-[13px] font-semibold"
                          style={{ color: "var(--secondary)" }}
                        >
                          $0.99
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All books if no separation needed */}
            {books.length === 0 && (
              <div
                className="rounded-xl p-8 text-center"
                style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
              >
                <p className="text-[15px]" style={{ color: "var(--secondary)" }}>
                  No summaries available yet. Check back soon.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
