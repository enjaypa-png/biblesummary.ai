"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export default function ListenPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookSlug = searchParams.get("book");
  const chapterParam = searchParams.get("chapter");

  const { books, loadBooks, selectedBook, selectedChapter, setSelection } = useAudioPlayer();

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (books.length === 0) return;

    if (bookSlug && chapterParam) {
      const matchedBook = books.find((b) => b.slug === bookSlug);
      const chapter = parseInt(chapterParam, 10);
      if (matchedBook && !isNaN(chapter) && chapter >= 1) {
        router.replace(`/listen/player?book=${bookSlug}&chapter=${chapter}`);
        return;
      }
    }
    if (bookSlug) {
      const matchedBook = books.find((b) => b.slug === bookSlug);
      if (matchedBook) {
        const chapter = chapterParam ? parseInt(chapterParam, 10) : 1;
        setSelection(matchedBook, isNaN(chapter) || chapter < 1 ? 1 : chapter);
      }
    }
  }, [bookSlug, chapterParam, books, setSelection, router]);

  function handleBookChange(slug: string) {
    const book = books.find((b) => b.slug === slug);
    if (book) {
      setSelection(book, 1);
    }
  }

  function handleChapterSelect(chapter: number) {
    if (selectedBook) {
      router.push(`/listen/player?book=${selectedBook.slug}&chapter=${chapter}`);
    }
  }

  if (books.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <p className="text-[14px]" style={{ color: "var(--secondary)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "var(--background)" }}>
      <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <h1
          className="font-semibold text-center max-w-lg mx-auto"
          style={{ color: "var(--foreground)", fontSize: "17px" }}
        >
          Listen
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {/* Book selection */}
        <div className="mb-6">
          <label
            className="block font-semibold mb-2 text-[11px] uppercase tracking-wider"
            style={{ color: "var(--secondary)" }}
          >
            Select Book
          </label>
          <select
            value={selectedBook?.slug || ""}
            onChange={(e) => handleBookChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none appearance-none"
            style={{
              backgroundColor: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              fontSize: "15px",
              minHeight: "48px",
            }}
          >
            {books.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Chapter grid — selection only, navigates to playback screen */}
        {selectedBook && (
          <div className="mb-8">
            <label className="block text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--secondary)" }}>
              Select Chapter
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: selectedBook.total_chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChapterSelect(ch)}
                  className="aspect-square rounded-xl flex items-center justify-center font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                    border: "0.5px solid var(--border)",
                    fontSize: "13px",
                    minHeight: "40px",
                    minWidth: "40px",
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[11px] tracking-wide" style={{ color: "var(--secondary)" }}>
          KING JAMES VERSION
        </p>
      </main>
    </div>
  );
}
