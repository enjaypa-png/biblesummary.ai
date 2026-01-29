"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { canAutoplay, preloadAudio } from "@/lib/audio-utils";

const WELCOME_TEXT =
  "Welcome to BibleSummary.ai. Here, you can read the King James Version of the Bible freely — just as it was written. When I set out to read the Bible in full, I realized how long the journey truly was… and how difficult it could be to retain what I had read. This app was created to help you understand, remember, and return to Scripture — without replacing it. Reading the Bible will always remain free here. Summaries help support the work behind this project, but the Word itself is never hidden.";

interface AudioWelcomeProps {
  onComplete: () => void;
}

export default function AudioWelcome({ onComplete }: AudioWelcomeProps) {
  const [showCaptions, setShowCaptions] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const audio = await preloadAudio("/audio/welcome-message.mp3");
      if (cancelled) return;

      if (audio) {
        audioRef.current = audio;
        setAudioAvailable(true);

        const autoplayAllowed = await canAutoplay();
        if (autoplayAllowed && !cancelled) {
          try {
            await audio.play();
            setIsPlaying(true);
            audio.addEventListener("ended", onComplete, { once: true });
            return;
          } catch {
            // Fall through to captions
          }
        }
      }

      // No audio or autoplay blocked — show captions
      if (!cancelled) {
        setShowCaptions(true);
        timerRef.current = setTimeout(onComplete, 20000);
      }
    }

    init();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [onComplete, cleanup]);

  function handleManualPlay() {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setShowCaptions(false);
          if (timerRef.current) clearTimeout(timerRef.current);
          audioRef.current!.addEventListener("ended", onComplete, {
            once: true,
          });
        })
        .catch(() => {
          // Still can't play; keep captions
        });
    }
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full w-full px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      role="region"
      aria-label="Welcome message"
      aria-live="polite"
    >
      {/* Waveform indicator when playing */}
      {isPlaying && (
        <div className="flex items-end gap-1 mb-8 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-[#C9A84C] intro-waveform"
              style={{
                animationDelay: `${i * 0.15}s`,
                height: "8px",
              }}
            />
          ))}
        </div>
      )}

      {/* Captions */}
      {(showCaptions || isPlaying) && (
        <p
          className="text-center max-w-md leading-relaxed"
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "16px",
            color: "rgba(255,255,255,0.85)",
            lineHeight: "1.8",
          }}
        >
          {WELCOME_TEXT}
        </p>
      )}

      {/* Manual play button when autoplay blocked */}
      {showCaptions && audioAvailable && !isPlaying && (
        <button
          onClick={handleManualPlay}
          className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors"
          style={{
            backgroundColor: "rgba(201,168,76,0.2)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: "#C9A84C",
          }}
          aria-label="Play welcome audio"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4 2.5v11l9-5.5L4 2.5z" />
          </svg>
          <span className="text-sm">Listen</span>
        </button>
      )}

      {/* Caption-only fallback (no audio file at all) */}
      {showCaptions && !audioAvailable && (
        <p
          className="mt-6 text-xs"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Audio narration coming soon
        </p>
      )}
    </motion.div>
  );
}
