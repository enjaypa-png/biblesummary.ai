"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export default function ListenPlayerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (books.length === 0 || !bookSlug) return;

    const matchedBook = books.find((b) => b.slug === bookSlug);
    if (!matchedBook) return;

    const chapter = chapterParam ? parseInt(chapterParam, 10) : 1;
    const validChapter = isNaN(chapter) || chapter < 1 ? 1 : Math.min(chapter, matchedBook.total_chapters);
    setSelection(matchedBook, validChapter);
  }, [bookSlug, chapterParam, books, setSelection]);

  // Redirect back to Listen selection if no book
  useEffect(() => {
    if (books.length > 0 && !bookSlug) {
      router.replace("/listen");
    }
  }, [books.length, bookSlug, router]);

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

  if (books.length === 0 || !selectedBook || !bookSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <p className="text-[14px]" style={{ color: "var(--secondary)" }}>Loading…</p>
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
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link
            href="/listen"
            className="flex items-center gap-2 text-[15px] font-medium"
            style={{ color: "var(--foreground)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </Link>
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
            Now Playing
          </h1>
          <div className="w-[60px]" aria-hidden />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        <div
          className="rounded-2xl p-8 mb-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-center mb-6">
            <h2
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "28px",
              }}
            >
              {selectedBook.name} {selectedChapter}
            </h2>
            <p className="text-[14px] mt-2" style={{ color: "var(--secondary)" }}>
              King James Version
            </p>
            {isActive && currentlyPlayingVerse && (
              <p className="text-[13px] mt-2" style={{ color: "var(--secondary)" }}>
                Verse {currentlyPlayingVerse} of {totalVerses}
              </p>
            )}
          </div>

          {/* Large primary Play button — playback does not start until user presses */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="w-20 h-20 flex items-center justify-center rounded-full transition-all active:scale-95"
              style={{ backgroundColor: "var(--accent)" }}
              title={isPlaying ? "Pause" : "Start Listening"}
            >
              {isLoading ? (
                <svg width="32" height="32" viewBox="0 0 24 24" className="animate-spin">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
                </svg>
              ) : isPlaying ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <polygon points="8 4 20 12 8 20 8 4"/>
                </svg>
              )}
            </button>

            <span className="text-[14px] font-medium" style={{ color: "var(--secondary)" }}>
              {isActive ? (isPlaying ? "Pause" : "Resume") : "Start Listening"}
            </span>
            {isActive && (
              <button
                onClick={stop}
                className="text-[13px] font-medium"
                style={{ color: "var(--secondary)" }}
              >
                Stop
              </button>
            )}
          </div>

          <p className="text-center text-[13px] mb-6" style={{ color: "var(--secondary)" }}>
            Audio plays while you read along
          </p>

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
            {isActive ? "Go to Text" : "Read Along"}
          </Link>
        </div>
      </main>
    </div>
  );
}
