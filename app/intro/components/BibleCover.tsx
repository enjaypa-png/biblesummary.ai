"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface BibleCoverProps {
  onComplete: () => void;
}

export default function BibleCover({ onComplete }: BibleCoverProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.2 : 0.8 }}
      role="region"
      aria-label="Bible cover"
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(180,140,80,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Bible cover */}
      <div
        className={`relative w-[260px] h-[360px] rounded-md shadow-2xl flex flex-col items-center justify-center ${
          reducedMotion ? "" : "intro-breathe"
        }`}
        style={{
          background:
            "linear-gradient(145deg, #5C3A1E 0%, #3E2510 50%, #2A1809 100%)",
          border: "2px solid rgba(180,140,80,0.3)",
          boxShadow:
            "0 0 60px rgba(180,140,80,0.15), 0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Leather texture overlay */}
        <div
          className="absolute inset-0 rounded-md opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.15'%3E%3Cpath d='M0 0h20v20H0zM20 20h20v20H20z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Spine edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-3 rounded-l-md"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.4), transparent)",
          }}
        />

        {/* Gold cross */}
        <div className="mb-6 opacity-80">
          <svg
            width="40"
            height="56"
            viewBox="0 0 40 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="16" y="0" width="8" height="56" rx="1" fill="#C9A84C" />
            <rect x="4" y="14" width="32" height="8" rx="1" fill="#C9A84C" />
          </svg>
        </div>

        {/* Title */}
        <h1
          className="text-center tracking-widest uppercase"
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "18px",
            color: "#C9A84C",
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            letterSpacing: "0.25em",
          }}
        >
          Holy Bible
        </h1>

        <div
          className="mt-2 w-16 h-px"
          style={{ backgroundColor: "rgba(201,168,76,0.4)" }}
        />

        <p
          className="mt-2 text-xs tracking-wider uppercase"
          style={{ color: "rgba(201,168,76,0.6)" }}
        >
          King James Version
        </p>
      </div>
    </motion.div>
  );
}
