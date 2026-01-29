"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { preloadAudio } from "@/lib/audio-utils";

interface OpeningTransitionProps {
  onComplete: () => void;
}

export default function OpeningTransition({
  onComplete,
}: OpeningTransitionProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    // Play page-turn sound
    preloadAudio("/audio/page-turn.mp3").then((audio) => {
      if (audio) {
        audio.volume = 0.4;
        audio.play().catch(() => {});
      }
    });

    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="flex items-center justify-center h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      role="region"
      aria-label="Bible opening animation"
    >
      {/* Light spill effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,245,220,0.1) 0%, transparent 60%)",
        }}
      />

      {/* Book opening animation */}
      <div
        className="relative"
        style={{ perspective: "1200px", width: "280px", height: "380px" }}
      >
        {/* Left page (static) */}
        <div
          className="absolute left-0 top-0 w-[140px] h-[380px] rounded-l-sm"
          style={{
            background:
              "linear-gradient(to right, #F5ECD7 0%, #FAF6ED 80%, #EDE4CF 100%)",
            boxShadow: "inset -2px 0 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Page lines */}
          <div className="p-6 pt-12 space-y-2">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="h-px"
                style={{
                  backgroundColor: "rgba(0,0,0,0.06)",
                  width: `${70 + Math.random() * 30}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Right page (turning) */}
        <motion.div
          className="absolute right-0 top-0 w-[140px] h-[380px] rounded-r-sm origin-left"
          style={{
            background:
              "linear-gradient(to left, #F5ECD7 0%, #FAF6ED 80%, #EDE4CF 100%)",
            boxShadow: "inset 2px 0 8px rgba(0,0,0,0.1)",
            transformStyle: "preserve-3d",
          }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: reducedMotion ? 0 : -160 }}
          transition={{
            duration: reducedMotion ? 0 : 3,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.5,
          }}
        >
          <div className="p-6 pt-12 space-y-2">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="h-px"
                style={{
                  backgroundColor: "rgba(0,0,0,0.06)",
                  width: `${70 + Math.random() * 30}%`,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Center spine shadow */}
        <div
          className="absolute left-1/2 top-0 w-1 h-full -translate-x-1/2"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.15), transparent, rgba(0,0,0,0.15))",
          }}
        />
      </div>
    </motion.div>
  );
}
