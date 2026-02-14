"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export default function ListenPage() {
  const searchParams = useSearchParams();
  const bookSlug = searchParams.get("book");
  const chapterParam = searchParams.get("chapter");

  const {
    books,
    loadBooks,
    selectedBook,
    selectedChapter,
    setSelection,
    audioState,
    currentlyPlayingVerse,
    totalVerses,
    play,
    pause,
    resume,
    stop,
  } = useAudioPlayer();

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Handle URL params on mount
  useEffect(() => {
    if (books.length === 0) return;

    if (bookSlug) {
      const matchedBook = books.find(b => b.slug === bookSlug);
      if (matchedBook) {
        const chapter = chapterParam ? parseInt(chapterParam, 10) : 1;
        setSelection(matchedBook, isNaN(chapter) || chapter < 1 ? 1 : chapter);
      }
    }
  }, [bookSlug, chapterParam, books, setSelection]);

  function handleBookChange(slug: string) {
    const book = books.find((b) => b.slug === slug);
    if (book) {
      stop();
      setSelection(book, 1);
    }
  }

  function handleChapterChange(chapter: number) {
    if (selectedBook) {
      stop();
      setSelection(selectedBook, chapter);
    }
  }

  function handlePlayPause() {
    if (audioState === "playing") {
      pause();
      return;
    }
    if (audioState === "paused") {
      resume();
      return;
    }
    play();
  }

  if (books.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <p className="text-[14px]" style={{ color: "var(--secondary)" }}>Loading...</p>
      </div>
    );
  }

  const isPlaying = audioState === "playing";
  const isPaused = audioState === "paused";
  const isLoading = audioState === "loading";
  const isActive = isPlaying || isPaused || isLoading;

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
        {/* Quick selection */}
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
              minHeight: "48px"
            }}
          >
            {books.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Chapter grid */}
        {selectedBook && (
          <div className="mb-8">
            <label className="block text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--secondary)" }}>
              Select Chapter
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: selectedBook.total_chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChapterChange(ch)}
                  className="aspect-square rounded-xl flex items-center justify-center font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: ch === selectedChapter ? "var(--accent)" : "var(--card)",
                    color: ch === selectedChapter ? "#fff" : "var(--foreground)",
                    border: ch === selectedChapter ? "none" : "0.5px solid var(--border)",
                    fontSize: "13px",
                    minHeight: "40px",
                    minWidth: "40px"
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current selection card */}
        {selectedBook && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="text-center mb-4">
              <h2
                className="font-semibold tracking-tight"
                style={{
                  color: "var(--foreground)",
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: "24px"
                }}
              >
                {selectedBook.name} {selectedChapter}
              </h2>
              {isActive && currentlyPlayingVerse && (
                <p className="text-[13px] mt-1" style={{ color: "var(--secondary)" }}>
                  Verse {currentlyPlayingVerse} of {totalVerses}
                </p>
              )}
            </div>

            {/* Audio controls */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <button
                onClick={handlePlayPause}
                disabled={isLoading}
                className="w-16 h-16 flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{ backgroundColor: "var(--accent)" }}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" className="animate-spin">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
                  </svg>
                ) : isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <polygon points="8 4 20 12 8 20 8 4"/>
                  </svg>
                )}
              </button>

              {isActive && (
                <button
                  onClick={stop}
                  className="w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-95"
                  style={{ border: "1.5px solid var(--border)" }}
                  title="Stop"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--secondary)">
                    <rect x="6" y="6" width="12" height="12" rx="1"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Link to text page - primary CTA */}
            <Link
              href={`/bible/${selectedBook.slug}/${selectedChapter}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98]"
              style={{
                backgroundColor: "var(--accent)",
                color: "#fff",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
              </svg>
              {isActive ? "Go to Text" : "Read & Listen"}
            </Link>

            <p className="text-center text-[11px] mt-3" style={{ color: "var(--secondary)" }}>
              Audio plays while you read along
            </p>
          </div>
        )}

        <p className="text-center text-[11px] tracking-wide" style={{ color: "var(--secondary)" }}>
          KING JAMES VERSION
        </p>
      </main>
    </div>
  );
}
