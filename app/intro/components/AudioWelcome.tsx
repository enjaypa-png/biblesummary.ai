"use client";

import { useEffect, useState, useRef } from "react";
import { canAutoplay, playAudio, getAudioErrorMessage } from "@/lib/audio-utils";

interface AudioWelcomeProps {
  onComplete: () => void;
  audioSrc?: string;
}

const WELCOME_SCRIPT = `Welcome to BibleSummary.ai.

Here, you can read the King James Version of the Bible freely — just as it was written.

When I set out to read the Bible in full, I realized how long the journey truly was… and how difficult it could be to retain what I had read.

This app was created to help you understand, remember, and return to Scripture — without replacing it.

Reading the Bible will always remain free here.

Summaries help support the work behind this project, but the Word itself is never hidden.`;

/**
 * Audio Welcome Component
 * 
 * Plays welcome narration with fallback to text captions.
 * Handles autoplay restrictions gracefully.
 */
export default function AudioWelcome({ 
  onComplete, 
  audioSrc = "/audio/welcome-message.mp3" 
}: AudioWelcomeProps) {
  const [autoplaySupported, setAutoplaySupported] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check autoplay support
    canAutoplay().then(supported => {
      setAutoplaySupported(supported);
      setShowCaptions(!supported);
    });

    // Preload audio
    audioRef.current = new Audio(audioSrc);
    audioRef.current.preload = 'auto';

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioSrc]);

  useEffect(() => {
    // Auto-play if supported
    if (autoplaySupported && audioRef.current && !isPlaying) {
      handlePlay();
    }
  }, [autoplaySupported]);

  const handlePlay = async () => {
    if (!audioRef.current) return;

    const success = await playAudio(audioRef.current, {
      volume: 0.7,
      onEnded: () => {
        setIsPlaying(false);
        onComplete();
      },
      onError: (err) => {
        setError(getAudioErrorMessage(err));
        setShowCaptions(true);
      },
    });

    if (success) {
      setIsPlaying(true);
      setShowCaptions(true);
      setError(null);
    } else {
      setShowCaptions(true);
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
      <div className="audio-welcome-container">
        {/* Audio Status */}
        {!autoplaySupported && !isPlaying && (
          <button 
            onClick={handlePlay}
            className="play-button"
            aria-label="Play welcome message"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
            </svg>
            <span>Tap to hear welcome message</span>
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Captions */}
        {showCaptions && (
          <div className="captions">
            {WELCOME_SCRIPT.split('\n\n').map((paragraph, index) => (
              <p key={index} className="caption-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Skip Button */}
        <button 
          onClick={handleSkip}
          className="skip-button"
          aria-label="Skip introduction"
        >
          Skip
        </button>
      </div>

      <style jsx>{`
        .audio-welcome-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          padding: 2rem;
        }

        .audio-welcome-container {
          max-width: 600px;
          width: 100%;
          position: relative;
        }

        .play-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          background: none;
          border: none;
          color: #d4af37;
          cursor: pointer;
          padding: 2rem;
          transition: transform 0.2s ease;
          margin: 0 auto;
        }

        .play-button:hover {
          transform: scale(1.05);
        }

        .play-button:active {
          transform: scale(0.95);
        }

        .play-button span {
          font-size: 1rem;
          font-weight: 500;
          color: #f5f5dc;
        }

        .error-message {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          color: #fca5a5;
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 2rem;
        }

        .captions {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          padding: 2rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .caption-paragraph {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 1.125rem;
          line-height: 1.8;
          color: #f5f5dc;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .caption-paragraph:last-child {
          margin-bottom: 0;
        }

        .skip-button {
          position: absolute;
          top: -1rem;
          right: 0;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #f5f5dc;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .skip-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Scrollbar styling */
        .captions::-webkit-scrollbar {
          width: 8px;
        }

        .captions::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .captions::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 4px;
        }

        .captions::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }
      `}</style>
    </div>
  );
}
