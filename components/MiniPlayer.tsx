"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MiniPlayer() {
  const {
    selectedBook,
    selectedChapter,
    audioState,
    currentlyPlayingVerse,
    totalVerses,
    play,
    pause,
    resume,
    stop,
  } = useAudioPlayer();

  const pathname = usePathname();

  // Don't show if not playing/paused or no selection
  if (!selectedBook || (audioState !== "playing" && audioState !== "paused" && audioState !== "loading")) {
    return null;
  }

  // Don't show on Bible text pages (they have their own audio controls)
  if (pathname.startsWith("/bible/") && pathname.split("/").length >= 4) {
    return null;
  }

  // Don't show on the Listen page (it has full controls)
  if (pathname === "/listen") {
    return null;
  }

  const progress = totalVerses > 0 && currentlyPlayingVerse
    ? (currentlyPlayingVerse / totalVerses) * 100
    : 0;

  const handlePlayPause = () => {
    if (audioState === "playing") {
      pause();
    } else if (audioState === "paused") {
      resume();
    } else {
      play();
    }
  };

  return (
    <div
      className="fixed left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        bottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
        backgroundColor: "var(--card)",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* Progress bar */}
      <div
        className="h-0.5 transition-all duration-300"
        style={{
          width: `${progress}%`,
          backgroundColor: "var(--accent)",
        }}
      />

      <div className="flex items-center gap-3 px-4 py-2.5 max-w-2xl mx-auto">
        {/* Book/Chapter info - links to text page */}
        <Link
          href={`/bible/${selectedBook.slug}/${selectedChapter}`}
          className="flex-1 min-w-0"
        >
          <p
            className="text-[14px] font-semibold truncate"
            style={{ color: "var(--foreground)", fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            {selectedBook.name} {selectedChapter}
          </p>
          <p
            className="text-[11px] truncate"
            style={{ color: "var(--secondary)" }}
          >
            {audioState === "loading" ? "Loading..." :
             currentlyPlayingVerse ? `Verse ${currentlyPlayingVerse} of ${totalVerses}` :
             "Tap to follow along"}
          </p>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause button */}
          <button
            onClick={handlePlayPause}
            disabled={audioState === "loading"}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              backgroundColor: "var(--accent)",
              minHeight: "44px",
              minWidth: "44px",
            }}
            title={audioState === "playing" ? "Pause" : "Play"}
          >
            {audioState === "loading" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="60"
                  strokeDashoffset="20"
                  strokeLinecap="round"
                />
              </svg>
            ) : audioState === "playing" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="8 4 20 12 8 20 8 4" />
              </svg>
            )}
          </button>

          {/* Stop button */}
          <button
            onClick={stop}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              backgroundColor: "transparent",
              border: "1.5px solid var(--border)",
              minHeight: "44px",
              minWidth: "44px",
            }}
            title="Stop"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--secondary)">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
