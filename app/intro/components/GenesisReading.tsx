"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { preloadAudio } from "@/lib/audio-utils";

const GENESIS_1_1 =
  "In the beginning God created the heaven and the earth.";

interface GenesisReadingProps {
  onComplete: () => void;
}

export default function GenesisReading({ onComplete }: GenesisReadingProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Try to play genesis audio
    preloadAudio("/audio/genesis-1-reading.mp3").then((audio) => {
      if (audio) {
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
    });

    const timer = setTimeout(onComplete, 10000);
    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full w-full px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      role="region"
      aria-label="Genesis chapter 1, verse 1"
    >
      {/* Book and chapter label */}
      <motion.p
        className="mb-6 text-xs tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,255,255,0.4)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Genesis 1:1
      </motion.p>

      {/* Scripture text */}
      <motion.p
        className="text-center max-w-sm"
        style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: "24px",
          lineHeight: "1.7",
          color: "rgba(255,255,255,0.9)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
      >
        {GENESIS_1_1}
      </motion.p>

      {/* Decorative divider */}
      <motion.div
        className="mt-8 w-12 h-px"
        style={{ backgroundColor: "rgba(201,168,76,0.4)" }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      />
    </motion.div>
  );
}
