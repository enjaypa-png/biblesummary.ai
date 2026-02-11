"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { parseSummaryMarkdown } from "@/lib/parseSummary";
import SummaryPaywall from "@/components/SummaryPaywall";

interface SummaryViewClientProps {
  bookId: string;
  bookName: string;
  bookSlug: string;
  summaryText: string;
}

export default function SummaryViewClient({
  bookId,
  bookName,
  bookSlug,
  summaryText,
}: SummaryViewClientProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function checkAccess() {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);

      if (!user) {
        setHasAccess(false);
        return;
      }

      // If returning from Stripe checkout, verify the purchase first
      const sessionId = searchParams.get("session_id");
      if (searchParams.get("checkout") === "success" && sessionId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await fetch("/api/verify-purchase", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ sessionId }),
            });
          }
        } catch {
          // Verification failed — fall through to normal access check
        }
      }

      const { data, error } = await supabase.rpc("user_has_summary_access", {
        p_user_id: user.id,
        p_book_id: bookId,
      });

      if (error) {
        setHasAccess(false);
        return;
      }
      setHasAccess(!!data);
    }
    checkAccess();
  }, [bookId, searchParams]);

  const { title, sections } = parseSummaryMarkdown(summaryText, bookName);

  if (hasAccess === null) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{
            backgroundColor: "var(--background-blur)",
            borderBottom: "0.5px solid var(--border)",
          }}
        >
          <Link
            href="/summaries"
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            ← Summaries
          </Link>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 flex justify-center">
          <span
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--accent)",
            }}
          />
        </main>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{
            backgroundColor: "var(--background-blur)",
            borderBottom: "0.5px solid var(--border)",
          }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link
              href="/summaries"
              className="text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              ← Summaries
            </Link>
            <h1
              className="text-[15px] font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {bookName}
            </h1>
            <span className="w-[70px]" />
          </div>
        </header>
        <SummaryPaywall bookName={bookName} bookId={bookId} bookSlug={bookSlug} isAuthenticated={isAuthenticated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--background-blur)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/summaries"
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            ← Summaries
          </Link>
          <h1
            className="text-[15px] font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {bookName}
          </h1>
          <span className="w-[70px]" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 pb-24">
        <div
          className="leading-relaxed"
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            color: "var(--foreground)",
          }}
        >
          <h2
            className="text-xl font-semibold mb-6"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h2>

          {sections.map((section, i) => (
            <section key={i} className="mb-8">
              <h3
                className="text-[12px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: "var(--accent)", fontFamily: "'Inter', sans-serif" }}
              >
                {section.label}
              </h3>
              <div className="space-y-3">
                {section.body.split(/\n\n+/).map((para, j) => (
                  <p
                    key={j}
                    className="text-[15px] leading-[1.7]"
                    style={{ color: "var(--foreground)" }}
                  >
                    {para.trim()}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
