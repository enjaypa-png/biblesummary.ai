"use client";

import { useEffect, useState, useRef } from "react";
import { playAudio } from "@/lib/audio-utils";

interface GenesisReadingProps {
  onComplete: () => void;
  verseText: string;
  audioSrc?: string;
}

/**
 * Genesis Reading Component
 * 
 * Displays Genesis 1:1 with optional audio narration.
 * Final screen of the opening experience.
 */
export default function GenesisReading({ 
  onComplete, 
  verseText,
  audioSrc = "/audio/genesis-1-reading.mp3" 
}: GenesisReadingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fade in
    const fadeTimer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    // Preload audio
    audioRef.current = new Audio(audioSrc);
    audioRef.current.preload = 'auto';

    // Try to auto-play audio
    const playTimer = setTimeout(() => {
      handlePlay();
    }, 1000);

    // Auto-complete after reasonable time
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 10000); // 10 seconds

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(playTimer);
      clearTimeout(completeTimer);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioSrc, onComplete]);

  const handlePlay = async () => {
    if (!audioRef.current || isPlaying) return;

    const success = await playAudio(audioRef.current, {
      volume: 0.7,
      onEnded: () => {
        setIsPlaying(false);
        // Wait a moment, then complete
        setTimeout(() => {
          onComplete();
        }, 2000);
      },
    });

    if (success) {
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="genesis-reading-screen">
      <div 
        className={`genesis-container ${isVisible ? 'visible' : ''}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onTouchStart={() => setShowControls(true)}
      >
        {/* Book and Chapter */}
        <div className="scripture-header">
          <h2 className="book-name">Genesis</h2>
          <span className="chapter-number">Chapter 1</span>
        </div>

        {/* Verse Text */}
        <div className="verse-container">
          <sup className="verse-number">1</sup>
          <p className="verse-text">{verseText}</p>
        </div>

        {/* Audio Controls (hidden by default) */}
        {showControls && (
          <div className="audio-controls">
            {!isPlaying ? (
              <button 
                onClick={handlePlay}
                className="control-button"
                aria-label="Play audio"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                </svg>
              </button>
            ) : (
              <button 
                onClick={handlePause}
                className="control-button"
                aria-label="Pause audio"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                  <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Continue Button */}
        <button 
          onClick={handleContinue}
          className="continue-button"
        >
          Continue to Bible
        </button>
      </div>

      <style jsx>{`
        .genesis-reading-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to bottom, #2d2416 0%, #1a1a1a 100%);
          padding: 2rem;
        }

        .genesis-container {
          max-width: 700px;
          width: 100%;
          background: rgba(245, 245, 220, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 16px;
          padding: 3rem 2rem;
          opacity: 0;
          transform: translateY(20px);
          transition: all 1s ease;
          position: relative;
        }

        .genesis-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .scripture-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }

        .book-name {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 2rem;
          font-weight: 600;
          color: #d4af37;
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
        }

        .chapter-number {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #8E8E93;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .verse-container {
          margin: 2rem 0;
        }

        .verse-number {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: #d4af37;
          vertical-align: super;
          margin-right: 0.5rem;
        }

        .verse-text {
          font-family: 'Source Serif 4', 'Georgia', serif;
          font-size: 1.5rem;
          line-height: 2;
          color: #f5f5dc;
          text-align: center;
          margin: 0;
        }

        .audio-controls {
          display: flex;
          justify-content: center;
          margin: 2rem 0;
          animation: fadeIn 0.3s ease;
        }

        .control-button {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #d4af37;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-button:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: scale(1.05);
        }

        .control-button:active {
          transform: scale(0.95);
        }

        .continue-button {
          display: block;
          margin: 2rem auto 0;
          padding: 0.75rem 2rem;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #d4af37;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .continue-button:hover {
          background: rgba(212, 175, 55, 0.2);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Mobile adjustments */
        @media (max-width: 640px) {
          .genesis-container {
            padding: 2rem 1.5rem;
          }

          .book-name {
            font-size: 1.5rem;
          }

          .verse-text {
            font-size: 1.25rem;
            line-height: 1.8;
          }
        }
      `}</style>
    </div>
  );
}
