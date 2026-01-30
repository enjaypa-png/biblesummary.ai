"use client";

import { useEffect, useState } from "react";

interface BibleCoverProps {
  onComplete: () => void;
  duration?: number; // milliseconds
}

/**
 * Bible Cover Component
 * 
 * Displays a physical Bible cover with subtle animation.
 * First screen of the opening experience.
 */
export default function BibleCover({ onComplete, duration = 3000 }: BibleCoverProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setIsVisible(true);

    // Auto-advance after duration
    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div className="bible-cover-screen">
      <div 
        className={`bible-cover-container ${isVisible ? 'visible' : ''}`}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 1s ease-in',
        }}
      >
        {/* Bible Cover Image */}
        <div className="bible-cover">
          {/* Placeholder: Replace with actual Bible cover image */}
          <div className="bible-cover-image">
            <div className="bible-cover-texture" />
            <h1 className="bible-cover-title">Holy Bible</h1>
          </div>
        </div>

        {/* Subtle ambient effects */}
        <div className="ambient-light" />
      </div>

      <style jsx>{`
        .bible-cover-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          overflow: hidden;
        }

        .bible-cover-container {
          position: relative;
          width: 100%;
          max-width: 400px;
          aspect-ratio: 3/4;
          padding: 2rem;
        }

        .bible-cover {
          width: 100%;
          height: 100%;
          position: relative;
          animation: breathe 4s ease-in-out infinite;
        }

        .bible-cover-image {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #3d2817 0%, #5c3d2e 50%, #3d2817 100%);
          border-radius: 8px;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .bible-cover-texture {
          position: absolute;
          inset: 0;
          background-image: 
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.1) 2px,
              rgba(0, 0, 0, 0.1) 4px
            );
          opacity: 0.3;
        }

        .bible-cover-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #d4af37;
          text-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(212, 175, 55, 0.3);
          letter-spacing: 0.1em;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .ambient-light {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 300px;
          height: 300px;
          background: radial-gradient(
            circle,
            rgba(255, 220, 150, 0.15) 0%,
            transparent 70%
          );
          transform: translate(-50%, -50%);
          animation: pulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .bible-cover {
            animation: none;
          }
          .ambient-light {
            animation: none;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
