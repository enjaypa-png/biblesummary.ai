"use client";

import { useEffect, useState, useRef } from "react";
import { canAutoplay, playAudio, getAudioErrorMessage } from "@/lib/audio-utils";

interface AudioWelcomeProps {
  onComplete: () => void;
  audioSrc?: string;
}

const WELCOME_PARAGRAPHS = [
  "Welcome to biblesummary.ai.",
  "Here, you can read the King James Version of the Bible freely — just as it was written.",
  "When I set out to read the Bible in full, I realized how long the journey truly was… and how difficult it could be to retain what I had read.",
  "This app was created to help you understand, remember, and return to Scripture — without replacing it.",
  "Reading the Bible will always remain free here.",
  "Summaries help support the work behind this project, but the Word itself is never hidden."
];

/**
 * Enhanced Audio Welcome Component
 * 
 * Displays the full welcome message with beautiful typography.
 * Plays audio narration (older male, firm but kind voice).
 * Falls back to manual play button if autoplay is blocked.
 * Shows all text as captions for accessibility.
 */
export default function AudioWelcome({ 
  onComplete, 
  audioSrc = "/audio/welcome-message.mp3" 
}: AudioWelcomeProps) {
  const [autoplaySupported, setAutoplaySupported] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check autoplay support
    canAutoplay().then(supported => {
      setAutoplaySupported(supported);
      if (!supported) {
        setShowPlayButton(true);
      }
    });

    // Preload audio
    const audio = new Audio(audioSrc);
    audio.preload = 'auto';
    audioRef.current = audio;

    // Auto-complete after 45 seconds (safety timeout)
    const safetyTimer = setTimeout(() => {
      onComplete();
    }, 45000);

    return () => {
      clearTimeout(safetyTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioSrc, onComplete]);

  useEffect(() => {
    // Auto-play if supported
    if (autoplaySupported && audioRef.current && !isPlaying) {
      handlePlay();
    }
  }, [autoplaySupported]);

  useEffect(() => {
    // Animate through paragraphs
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentParagraph(prev => {
          if (prev < WELCOME_PARAGRAPHS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 6000); // ~6 seconds per paragraph

      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const handlePlay = async () => {
    if (!audioRef.current) return;

    const success = await playAudio(audioRef.current, {
      volume: 0.7,
      onEnded: () => {
        setIsPlaying(false);
        setTimeout(() => onComplete(), 1500);
      },
      onError: (err) => {
        setError(getAudioErrorMessage(err));
        setShowPlayButton(true);
      },
    });

    if (success) {
      setIsPlaying(true);
      setShowPlayButton(false);
      setError(null);
    } else {
      setShowPlayButton(true);
    }
  };

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onComplete();
  };

  return (
    <div className="audio-welcome-screen">
      {/* Background gradient */}
      <div className="background-gradient" />

      <div className="content-container">
        {/* Play button (if autoplay blocked) */}
        {showPlayButton && !isPlaying && (
          <button 
            onClick={handlePlay}
            className="play-button"
            aria-label="Play welcome message"
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                opacity="0.5"
              />
              <path 
                d="M9.5 8.5l7 3.5-7 3.5V8.5z" 
                fill="currentColor" 
              />
            </svg>
            <span className="play-button-text">Tap to hear welcome message</span>
          </button>
        )}

        {/* Audio playing indicator */}
        {isPlaying && (
          <div className="audio-indicator">
            <div className="waveform">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="waveform-bar"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <span className="audio-label">Playing...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Welcome message (always visible as captions) */}
        <div className="welcome-text">
          {WELCOME_PARAGRAPHS.map((paragraph, index) => (
            <p 
              key={index}
              className={`paragraph ${index <= currentParagraph ? 'visible' : ''} ${index === currentParagraph ? 'active' : ''}`}
              style={{
                transitionDelay: `${index * 0.2}s`,
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Continue button (appears after message) */}
        {currentParagraph >= WELCOME_PARAGRAPHS.length - 1 && (
          <button 
            onClick={handleSkip}
            className="continue-button"
          >
            Continue
          </button>
        )}
      </div>

      <style jsx>{`
        .audio-welcome-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          overflow: hidden;
        }

        .background-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(212, 175, 55, 0.05) 0%,
            transparent 60%
          );
          pointer-events: none;
        }

        .content-container {
          position: relative;
          max-width: 700px;
          width: 100%;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        /* Play button */
        .play-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          background: none;
          border: none;
          color: #d4af37;
          cursor: pointer;
          padding: 2rem;
          transition: all 0.3s ease;
          animation: fadeIn 0.8s ease;
        }

        .play-button:hover {
          transform: scale(1.05);
          color: #f4e4a6;
        }

        .play-button:active {
          transform: scale(0.95);
        }

        .play-button svg {
          filter: drop-shadow(0 4px 12px rgba(212, 175, 55, 0.3));
        }

        .play-button-text {
          font-family: 'Georgia', serif;
          font-size: 1.125rem;
          font-weight: 400;
          color: rgba(245, 245, 220, 0.8);
          letter-spacing: 0.05em;
        }

        /* Audio playing indicator */
        .audio-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          animation: fadeIn 0.5s ease;
        }

        .waveform {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 40px;
        }

        .waveform-bar {
          width: 4px;
          background: linear-gradient(
            to top,
            #d4af37,
            #f4e4a6
          );
          border-radius: 2px;
          animation: waveform 0.8s ease-in-out infinite;
        }

        .audio-label {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(212, 175, 55, 0.7);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* Error message */
        .error-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          color: #fca5a5;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          font-size: 0.875rem;
          animation: fadeIn 0.5s ease;
        }

        /* Welcome text */
        .welcome-text {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .paragraph {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 1.25rem;
          line-height: 1.9;
          color: rgba(245, 245, 220, 0.9);
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s ease;
        }

        .paragraph.visible {
          opacity: 0.6;
          transform: translateY(0);
        }

        .paragraph.active {
          opacity: 1;
          color: #f5f5dc;
          text-shadow: 0 2px 8px rgba(212, 175, 55, 0.2);
        }

        /* Continue button */
        .continue-button {
          margin-top: 2rem;
          padding: 0.875rem 2.5rem;
          background: rgba(212, 175, 55, 0.1);
          border: 1.5px solid rgba(212, 175, 55, 0.4);
          color: #d4af37;
          font-family: 'Georgia', serif;
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: fadeIn 0.8s ease;
        }

        .continue-button:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: rgba(212, 175, 55, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
        }

        .continue-button:active {
          transform: translateY(0);
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

        @keyframes waveform {
          0%, 100% {
            height: 8px;
          }
          50% {
            height: 32px;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .content-container {
            padding: 1.5rem;
          }

          .paragraph {
            font-size: 1.125rem;
            line-height: 1.8;
          }

          .play-button-text {
            font-size: 1rem;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .play-button,
          .audio-indicator,
          .error-message,
          .continue-button {
            animation: none;
          }

          .waveform-bar {
            animation: none;
            height: 16px;
          }

          .paragraph {
            transition: opacity 0.3s ease;
          }
        }
      `}</style>
    </div>
  );
}
