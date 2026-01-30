"use client";

import { useEffect, useState, useRef } from "react";

interface GenesisReadingProps {
  onComplete: () => void;
  verseText?: string;
  audioSrc?: string;
}

const DEFAULT_VERSE = "In the beginning God created the heaven and the earth.";

/**
 * Enhanced Genesis Reading Component
 * 
 * Displays Genesis 1:1 with beautiful typography.
 * Optional audio narration (same voice as welcome).
 * "Continue to Bible" button for user control.
 * Warm, reverent color palette.
 */
export default function GenesisReading({ 
  onComplete,
  verseText = DEFAULT_VERSE,
  audioSrc = "/audio/genesis-1-reading.mp3"
}: GenesisReadingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 300);

    // Show continue button after verse is displayed
    setTimeout(() => setShowButton(true), 3000);

    // Preload and try to play audio
    const audio = new Audio(audioSrc);
    audio.volume = 0.7;
    audioRef.current = audio;

    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        // Audio blocked, that's okay
      });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    // Auto-complete after 12 seconds (safety)
    const safetyTimer = setTimeout(() => {
      onComplete();
    }, 12000);

    return () => {
      clearTimeout(safetyTimer);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioSrc, onComplete]);

  const handleContinue = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onComplete();
  };

  return (
    <div className="genesis-reading-screen">
      {/* Background gradient */}
      <div className="background-gradient" />

      <div 
        className={`genesis-container ${isVisible ? 'visible' : ''}`}
      >
        {/* Book and chapter label */}
        <div className="scripture-header">
          <div className="header-line" />
          <h2 className="book-chapter">Genesis 1:1</h2>
          <div className="header-line" />
        </div>

        {/* Verse text */}
        <div className="verse-container">
          <p className="verse-text">{verseText}</p>
        </div>

        {/* Decorative element */}
        <div className="decorative-divider">
          <div className="divider-dot" />
          <div className="divider-line" />
          <div className="divider-dot" />
        </div>

        {/* Audio indicator (if playing) */}
        {isPlaying && (
          <div className="audio-indicator">
            <div className="audio-pulse" />
            <span className="audio-label">Listening...</span>
          </div>
        )}

        {/* Continue button */}
        {showButton && (
          <button 
            onClick={handleContinue}
            className="continue-button"
          >
            <span>Continue to Bible</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path 
                d="M5 12h14M12 5l7 7-7 7" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      <style jsx>{`
        .genesis-reading-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            to bottom,
            #0a0a0a 0%,
            #1a1410 50%,
            #0a0a0a 100%
          );
          overflow: hidden;
        }

        .background-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(212, 175, 55, 0.06) 0%,
            transparent 60%
          );
          pointer-events: none;
        }

        .genesis-container {
          position: relative;
          max-width: 800px;
          width: 100%;
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .genesis-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Scripture header */
        .scripture-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          width: 100%;
          max-width: 500px;
        }

        .header-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            rgba(212, 175, 55, 0.3),
            transparent
          );
        }

        .book-chapter {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(212, 175, 55, 0.8);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
        }

        /* Verse container */
        .verse-container {
          width: 100%;
          max-width: 650px;
          padding: 2rem;
          background: rgba(212, 175, 55, 0.02);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .verse-text {
          font-family: 'Source Serif 4', 'Georgia', serif;
          font-size: 1.75rem;
          line-height: 2;
          color: #f5f5dc;
          text-align: center;
          margin: 0;
          text-shadow: 0 2px 12px rgba(212, 175, 55, 0.15);
        }

        /* Decorative divider */
        .decorative-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          opacity: 0.6;
        }

        .divider-line {
          width: 60px;
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            rgba(212, 175, 55, 0.5),
            transparent
          );
        }

        .divider-dot {
          width: 4px;
          height: 4px;
          background: rgba(212, 175, 55, 0.5);
          border-radius: 50%;
        }

        /* Audio indicator */
        .audio-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: rgba(212, 175, 55, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 24px;
          animation: fadeIn 0.5s ease;
        }

        .audio-pulse {
          width: 8px;
          height: 8px;
          background: #d4af37;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .audio-label {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(212, 175, 55, 0.8);
          letter-spacing: 0.05em;
        }

        /* Continue button */
        .continue-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2.5rem;
          background: linear-gradient(
            135deg,
            rgba(212, 175, 55, 0.15) 0%,
            rgba(212, 175, 55, 0.08) 100%
          );
          border: 1.5px solid rgba(212, 175, 55, 0.4);
          color: #d4af37;
          font-family: 'Georgia', serif;
          font-size: 1.125rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: fadeIn 0.8s ease;
          position: relative;
          overflow: hidden;
        }

        .continue-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(212, 175, 55, 0.1) 50%,
            transparent 100%
          );
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .continue-button:hover::before {
          transform: translateX(100%);
        }

        .continue-button:hover {
          background: linear-gradient(
            135deg,
            rgba(212, 175, 55, 0.25) 0%,
            rgba(212, 175, 55, 0.15) 100%
          );
          border-color: rgba(212, 175, 55, 0.6);
          transform: translateY(-2px);
          box-shadow: 
            0 8px 24px rgba(212, 175, 55, 0.2),
            0 0 40px rgba(212, 175, 55, 0.1);
        }

        .continue-button:active {
          transform: translateY(0);
        }

        .continue-button svg {
          transition: transform 0.3s ease;
        }

        .continue-button:hover svg {
          transform: translateX(4px);
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .genesis-container {
            padding: 2rem 1.5rem;
            gap: 2rem;
          }

          .verse-text {
            font-size: 1.5rem;
            line-height: 1.9;
          }

          .continue-button {
            padding: 0.875rem 2rem;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .genesis-container {
            padding: 1.5rem 1rem;
            gap: 1.5rem;
          }

          .verse-container {
            padding: 1.5rem;
          }

          .verse-text {
            font-size: 1.25rem;
            line-height: 1.8;
          }

          .book-chapter {
            font-size: 0.75rem;
          }

          .continue-button {
            padding: 0.75rem 1.5rem;
            font-size: 0.9375rem;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .genesis-container {
            transition: opacity 0.5s ease;
          }

          .audio-indicator,
          .continue-button {
            animation: none;
          }

          .audio-pulse {
            animation: none;
          }

          .continue-button::before {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
