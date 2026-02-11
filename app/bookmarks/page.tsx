"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";

interface Bookmark {
  id: string;
  book_name: string;
  book_slug: string;
  chapter: number;
  verse: number;
  created_at: string;
}

export default function BookmarksPage() {
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (user) {
        const { data } = await supabase
          .from("bookmarks")
          .select("id, book_name, book_slug, chapter, verse, created_at")
          .eq("user_id", user.id)
          .single();
        if (data) setBookmark(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function removeBookmark() {
    if (!bookmark) return;
    const user = await getCurrentUser();
    if (!user) return;
    await supabase.from("bookmarks").delete().eq("user_id", user.id);
    setBookmark(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
        >
          <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
            Bookmarks
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
        <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
          Bookmarks
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {!bookmark ? (
          <div className="py-16 text-center">
            <div
              className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-[17px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              No bookmark set
            </h2>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: "var(--secondary)" }}>
              Tap the bookmark icon while reading to save your place.
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
          <div>
            <Link
              href={`/bible/${bookmark.book_slug}/${bookmark.chapter}?verse=${bookmark.verse}`}
              className="flex items-center gap-4 p-4 rounded-xl active:opacity-80 transition-opacity"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--accent)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <span className="block text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
                  {bookmark.book_name} {bookmark.chapter}:{bookmark.verse}
                </span>
                <span className="block text-[13px] mt-0.5" style={{ color: "var(--secondary)" }}>
                  Tap to jump to your bookmark
                </span>
              </div>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="flex-shrink-0">
                <path d="M1 1L6 6L1 11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            <button
              onClick={removeBookmark}
              className="w-full mt-4 py-3 rounded-xl text-[14px] font-medium transition-all active:opacity-70"
              style={{ color: "var(--error)", backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              Remove Bookmark
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
