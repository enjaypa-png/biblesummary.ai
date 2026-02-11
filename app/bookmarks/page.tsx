"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";

interface Bookmark {
  id: string;
  book_name: string;
  book_slug: string;
  book_id: string;
  chapter: number;
  verse: number;
  created_at: string;
  verse_text?: string;
}

type SortMode = "recent" | "book";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const loadBookmarks = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch all bookmarks
    const { data: bms } = await supabase
      .from("bookmarks")
      .select("id, book_name, book_slug, book_id, chapter, verse, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!bms || bms.length === 0) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    // Fetch verse text previews for each bookmark
    const enriched: Bookmark[] = await Promise.all(
      bms.map(async (bm) => {
        const { data: verseData } = await supabase
          .from("verses")
          .select("text")
          .eq("book_id", bm.book_id)
          .eq("chapter", bm.chapter)
          .eq("verse_number", bm.verse)
          .maybeSingle();
        return { ...bm, verse_text: verseData?.text || "" };
      })
    );

    setBookmarks(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  async function removeBookmark(id: string) {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  // Sort bookmarks
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    if (sortMode === "book") {
      return a.book_name.localeCompare(b.book_name) || a.chapter - b.chapter;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link
            href="/bible"
            className="flex items-center gap-1 text-[14px] font-medium"
            style={{ color: "var(--accent)" }}
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 className="text-[18px] font-bold" style={{ color: "var(--foreground)" }}>
            Bookmarks
          </h1>
          {bookmarks.length > 1 ? (
            <button
              onClick={() => setSortMode(sortMode === "recent" ? "book" : "recent")}
              className="flex items-center gap-1 text-[13px] font-medium active:opacity-70"
              style={{ color: "var(--accent)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M6 12h12M9 18h6" />
              </svg>
              {sortMode === "recent" ? "By Book" : "Recent"}
            </button>
          ) : (
            <span className="w-[60px]" />
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
            />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="py-20 text-center px-5">
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-[18px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              No bookmarks yet
            </h2>
            <p className="text-[14px] leading-relaxed mb-6 max-w-[260px] mx-auto" style={{ color: "var(--secondary)" }}>
              Tap the bookmark icon while reading any chapter to save it here.
            </p>
            <Link
              href="/bible"
              className="inline-block px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Start Reading
            </Link>
          </div>
        ) : (
          <div>
            {/* Bookmark count */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-[13px] font-medium" style={{ color: "var(--secondary)" }}>
                {bookmarks.length} {bookmarks.length === 1 ? "bookmark" : "bookmarks"}
              </p>
            </div>

            {/* Bookmark list */}
            {sortedBookmarks.map((bm, i) => (
              <div
                key={bm.id}
                className="relative"
                style={{
                  borderBottom: i < sortedBookmarks.length - 1 ? "0.5px solid var(--border)" : "none",
                }}
              >
                <Link
                  href={`/bible/${bm.book_slug}/${bm.chapter}?verse=${bm.verse}`}
                  className="flex gap-3.5 px-5 py-4 active:opacity-80 transition-opacity"
                >
                  {/* Bookmark icon */}
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="var(--accent)"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 mt-0.5"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-[17px] font-bold leading-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {bm.book_name} {bm.chapter}
                    </h3>
                    {bm.verse_text && (
                      <p
                        className="mt-1 text-[14px] leading-relaxed line-clamp-3"
                        style={{ color: "var(--foreground-secondary)" }}
                      >
                        {bm.verse_text}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Delete button */}
                <button
                  onClick={() => removeBookmark(bm.id)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg active:opacity-60 transition-opacity"
                  style={{ color: "var(--secondary)" }}
                  title="Remove bookmark"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
