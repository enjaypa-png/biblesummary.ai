"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { HIGHLIGHT_COLORS } from "@/lib/highlightColors";

interface Highlight {
  id: string;
  book: string;
  book_name: string;
  book_id: string;
  book_index: number;
  chapter: number;
  verse: number;
  color: string;
  created_at: string;
  verse_text?: string;
}

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHighlights();
  }, []);

  async function loadHighlights() {
    setLoading(true);
    const user = await getCurrentUser();

    if (user) {
      const { data } = await supabase
        .from("highlights")
        .select("*")
        .eq("user_id", user.id)
        .order("book_index", { ascending: true })
        .order("chapter", { ascending: true })
        .order("verse", { ascending: true });

      if (data && data.length > 0) {
        // Fetch verse texts
        const versePromises = data.map(async (h: Highlight) => {
          if (!h.book_id) return { id: h.id, text: "" };
          const { data: verseData } = await supabase
            .from("verses")
            .select("text")
            .eq("book_id", h.book_id)
            .eq("chapter", h.chapter)
            .eq("verse", h.verse)
            .single();
          return { id: h.id, text: verseData?.text || "" };
        });

        const verseTexts = await Promise.all(versePromises);
        const textMap = new Map(verseTexts.map((v) => [v.id, v.text]));

        setHighlights(
          data.map((h: Highlight) => ({
            ...h,
            verse_text: textMap.get(h.id) || "",
          }))
        );
      }
    }
    setLoading(false);
  }

  async function removeHighlight(id: string) {
    await supabase.from("highlights").delete().eq("id", id);
    setHighlights(highlights.filter((h) => h.id !== id));
  }

  // Group by book (already sorted canonically from query)
  const grouped = useMemo(() => {
    const groups: { bookName: string; bookSlug: string; highlights: Highlight[] }[] = [];
    let currentBook = "";
    let currentGroup: Highlight[] = [];
    let currentSlug = "";

    highlights.forEach((h) => {
      if (h.book_name !== currentBook) {
        if (currentGroup.length > 0) {
          groups.push({ bookName: currentBook, bookSlug: currentSlug, highlights: currentGroup });
        }
        currentBook = h.book_name;
        currentSlug = h.book;
        currentGroup = [h];
      } else {
        currentGroup.push(h);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ bookName: currentBook, bookSlug: currentSlug, highlights: currentGroup });
    }

    return groups;
  }, [highlights]);

  function truncateText(text: string, maxLength: number) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "\u2026";
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
        >
          <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
            Highlights
          </h1>
        </header>
        <main className="max-w-lg mx-auto px-5 py-20 text-center">
          <div
            className="w-6 h-6 mx-auto border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-[13px] font-medium" style={{ color: "var(--secondary)" }}>
            {highlights.length} {highlights.length === 1 ? "highlight" : "highlights"}
          </span>
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
            Highlights
          </h1>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {highlights.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--accent)" }}
              >
                <path d="m9 11-6 6v3h9l3-3" />
                <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
              </svg>
            </div>
            <h2 className="text-[17px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              No highlights yet
            </h2>
            <p className="text-[13px] leading-relaxed mb-6" style={{ color: "var(--secondary)" }}>
              Tap any verse, then tap Highlight to mark it with a color.
            </p>
            <Link
              href="/bible"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Start Reading
            </Link>
          </div>
        ) : (
          <div className="space-y-6 pb-24">
            {grouped.map((group) => (
              <div key={group.bookName}>
                {/* Book section divider */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                  <span
                    className="text-[12px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--secondary)" }}
                  >
                    {group.bookName}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                </div>
                {/* Highlights in this book */}
                <div className="space-y-2.5">
                  {group.highlights.map((h) => {
                    const colorDef = HIGHLIGHT_COLORS[h.color];
                    return (
                      <div
                        key={h.id}
                        className="rounded-xl p-4 transition-all"
                        style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Reference + color chip */}
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: colorDef?.swatch || "#999" }}
                              />
                              <span
                                className="text-[14px] font-semibold"
                                style={{ color: "var(--accent)" }}
                              >
                                {h.book_name} {h.chapter}:{h.verse}
                              </span>
                            </div>
                            {/* Verse text */}
                            {h.verse_text && (
                              <p
                                className="text-[13px] leading-relaxed"
                                style={{ color: "var(--foreground)" }}
                              >
                                &ldquo;{truncateText(h.verse_text, 150)}&rdquo;
                              </p>
                            )}
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={() => removeHighlight(h.id)}
                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center active:opacity-70"
                            style={{ color: "var(--secondary)" }}
                            title="Remove highlight"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {/* Go to verse link */}
                        <Link
                          href={`/bible/${h.book}/${h.chapter}?verse=${h.verse}`}
                          className="flex items-center gap-2 mt-3 pt-2 border-t active:opacity-70 transition-opacity"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <span className="text-[14px] font-medium" style={{ color: "var(--accent)" }}>
                            Go to verse
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
