"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface InlineAudioPlayerProps {
  bookSlug: string;
  chapter: number;
  totalVerses: number;
}

export default function InlineAudioPlayer({
  bookSlug,
  chapter,
  totalVerses,
}: InlineAudioPlayerProps) {
  const {
    books,
    audioState,
    currentlyPlayingVerse,
    totalVerses: contextTotalVerses,
    currentTrackId,
    play,
    pause,
    resume,
    stop,
  } = useAudioPlayer();

  const thisTrackId = `${bookSlug}:${chapter}`;
  const isThisTrackActive = currentTrackId === thisTrackId;
  const isPlaying = isThisTrackActive && audioState === "playing";
  const isPaused = isThisTrackActive && audioState === "paused";
  const isLoading = isThisTrackActive && audioState === "loading";
  const isActive = isPlaying || isPaused || isLoading;

  // Calculate progress
  const verseCount = isThisTrackActive ? contextTotalVerses : totalVerses;
  const currentVerse = currentlyPlayingVerse || 0;
  const progress = verseCount > 0 ? (currentVerse / verseCount) * 100 : 0;

  // Format verse counts as time-like display
  const elapsed = currentVerse;
  const remaining = verseCount - currentVerse;

  function handlePlayPause() {
    if (isLoading) return;

    if (isPlaying) {
      pause();
      return;
    }

    if (isPaused) {
      resume();
      return;
    }

    // Start playing — use current page's book (single audio authority)
    const book = books.find((b) => b.slug === bookSlug);
    if (book) {
      play(book, chapter);
    }
  }

  return (
    <div
      className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        disabled={isLoading}
        className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95"
        style={{
          backgroundColor: "var(--accent)",
        }}
        title={isPlaying ? "Pause" : isLoading ? "Loading..." : "Play"}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isLoading ? (
          <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin">
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
        ) : isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <polygon points="8 4 20 12 8 20 8 4" />
          </svg>
        )}
      </button>

      {/* Elapsed (verse count) */}
      <span
        className="text-[12px] tabular-nums w-8 text-right flex-shrink-0"
        style={{ color: "var(--foreground)" }}
      >
        {isActive ? elapsed : 0}
      </span>

      {/* Progress bar container */}
      <div className="flex-1 relative h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--accent)",
          }}
        />
      </div>

      {/* Remaining (verse count) */}
      <span
        className="text-[12px] tabular-nums w-8 flex-shrink-0"
        style={{ color: "var(--foreground)" }}
      >
        {isActive ? remaining : verseCount}
      </span>

      {/* Stop button - only when active */}
      {isActive && (
        <button
          onClick={stop}
          className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95"
          style={{
            backgroundColor: "var(--border)",
          }}
          title="Stop"
          aria-label="Stop"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--foreground)">
            <rect x="6" y="6" width="12" height="12" rx="1.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
