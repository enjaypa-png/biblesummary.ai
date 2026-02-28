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

export default function SummariesPageClient({ books }: { books: Book[] }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccess() {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);

      if (!user) { setLoading(false); return; }

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("type, status, current_period_end")
        .eq("user_id", user.id)
        .in("type", ["premium_annual", "premium_monthly", "summary_annual"]);

      const active = subs?.some(
        (s) => (s.status === "active" || s.status === "canceled") &&
          new Date(s.current_period_end) > new Date()
      );

      // Also check lifetime purchases
      const { data: purchases } = await supabase
        .from("purchases")
        .select("type")
        .eq("user_id", user.id)
        .eq("type", "lifetime");

      setHasPremium(!!active || (purchases?.length ?? 0) > 0);
      setLoading(false);
    }
    loadAccess();
  }, []);

  async function handleUpgrade() {
    setError(null);
    setCheckoutLoading(true);
    const result = await startCheckout({ product: "premium_annual", returnPath: "/summaries" });
    if (result.error) { setError(result.error); setCheckoutLoading(false); }
    else if (result.url) window.location.href = result.url;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
      >
        <h1 className="text-[18px] font-bold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
          Book Summaries
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-5 py-5 pb-24">
        <p className="text-[14px] leading-relaxed mb-5" style={{ color: "var(--secondary)" }}>
          Detailed, faithful summaries of every book — helping you retain what you read across months of study.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-[14px]" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
            {error}
          </div>
        )}

        {/* Premium active */}
        {!loading && hasPremium && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: "var(--card)", border: "1.5px solid var(--accent)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--accent)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>All Summaries Unlocked</p>
              <p className="text-[13px]" style={{ color: "var(--secondary)" }}>Your Premium plan includes every book summary.</p>
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {!loading && isAuthenticated && !hasPremium && (
          <div className="mb-6 p-5 rounded-2xl" style={{ backgroundColor: "var(--accent)" }}>
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-[13px] font-bold text-white/80 uppercase tracking-wider">Premium Feature</span>
            </div>
            <h2 className="text-[20px] font-bold text-white mb-1">All 66 Book Summaries</h2>
            <p className="text-[14px] text-white/80 mb-4 leading-relaxed">
              Unlock every summary with Premium — $79/yr or $9.99/mo.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="w-full py-3 rounded-xl text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-70"
              style={{ backgroundColor: "white", color: "var(--accent)" }}
            >
              {checkoutLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Processing...
                </span>
              ) : "Upgrade to Premium"}
            </button>
          </div>
        )}

        {/* Sign in CTA */}
        {!loading && !isAuthenticated && (
          <div className="mb-6 p-5 rounded-2xl text-center"
            style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--foreground)" }}>Sign in to access summaries</p>
            <p className="text-[13px] mb-4" style={{ color: "var(--secondary)" }}>Book summaries are included with Premium.</p>
            <Link href="/login" className="inline-block px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}>
              Sign In
            </Link>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            {books.map((book, i) => {
              const owned = hasPremium;
              return (
                <div key={book.id} className="flex items-center justify-between px-4 py-3.5"
                  style={{ borderBottom: i < books.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                  {owned ? (
                    <Link href={`/summaries/${book.slug}`} className="flex-1 min-w-0 active:opacity-70">
                      <span className="text-[16px] font-semibold truncate block" style={{ color: "var(--foreground)" }}>{book.name}</span>
                      <span className="text-[12px]" style={{ color: "var(--secondary)" }}>{book.testament} Testament</span>
                    </Link>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <span className="text-[16px] font-semibold truncate block" style={{ color: "var(--foreground)" }}>{book.name}</span>
                      <span className="text-[12px]" style={{ color: "var(--secondary)" }}>{book.testament} Testament</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {owned ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <svg width="5" height="9" viewBox="0 0 6 10" fill="none">
                          <path d="M1 1L5 5L1 9" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
