"use client";

import { useEffect, useState } from "react";

interface OpeningTransitionProps {
  onComplete: () => void;
  duration?: number;
}

/**
 * Opening Transition Component
 * 
 * Animates the Bible opening with page-turning effect.
 * Includes subtle light and sound effects.
 */
export default function OpeningTransition({ 
  onComplete, 
  duration = 5000 
}: OpeningTransitionProps) {
  const [phase, setPhase] = useState<'opening' | 'turning' | 'settling'>('opening');

  useEffect(() => {
    // Phase 1: Bible starts opening (0-2s)
    const openingTimer = setTimeout(() => {
      setPhase('turning');
    }, duration * 0.4);

    // Phase 2: Pages turn (2-4s)
    const turningTimer = setTimeout(() => {
      setPhase('settling');
    }, duration * 0.8);

    // Phase 3: Pages settle, complete (4-5s)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    // Play page-turn sound (if available)
    const audio = new Audio('/audio/page-turn.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore if audio fails
    });

    return () => {
      clearTimeout(openingTimer);
      clearTimeout(turningTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <div className="opening-transition-screen">
      <div className="bible-opening-container">
        {/* Left Page */}
        <div 
          className={`bible-page left-page ${phase}`}
          style={{
            transform: phase === 'opening' 
              ? 'rotateY(0deg)' 
              : phase === 'turning'
              ? 'rotateY(-90deg)'
              : 'rotateY(-180deg)',
          }}
        >
          <div className="page-content" />
        </div>

        {/* Right Page */}
        <div 
          className={`bible-page right-page ${phase}`}
          style={{
            transform: phase === 'opening' 
              ? 'rotateY(0deg)' 
              : phase === 'turning'
              ? 'rotateY(90deg)'
              : 'rotateY(180deg)',
          }}
        >
          <div className="page-content" />
        </div>

        {/* Light spilling from pages */}
        <div className={`page-light ${phase}`} />
      </div>

      <style jsx>{`
        .opening-transition-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          perspective: 1500px;
        }

        .bible-opening-container {
          position: relative;
          width: 80%;
          max-width: 600px;
          aspect-ratio: 2/1;
          transform-style: preserve-3d;
        }

        .bible-page {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(to bottom, #f5f5dc 0%, #e8e8d0 100%);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          transform-origin: center;
          transition: transform 2s cubic-bezier(0.4, 0, 0.2, 1);
          backface-visibility: hidden;
        }

        .left-page {
          left: 0;
          border-right: 1px solid rgba(0, 0, 0, 0.1);
        }

        .right-page {
          right: 0;
          border-left: 1px solid rgba(0, 0, 0, 0.1);
        }

        .page-content {
          width: 100%;
          height: 100%;
          padding: 2rem;
          background-image: 
            repeating-linear-gradient(
              transparent,
              transparent 1.5rem,
              rgba(0, 0, 0, 0.05) 1.5rem,
              rgba(0, 0, 0, 0.05) calc(1.5rem + 1px)
            );
        }

        .page-light {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 200px;
          background: radial-gradient(
            circle,
            rgba(255, 240, 200, 0.6) 0%,
            rgba(255, 240, 200, 0.3) 30%,
            transparent 70%
          );
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 1s ease;
          pointer-events: none;
          filter: blur(20px);
        }

        .page-light.turning,
        .page-light.settling {
          opacity: 1;
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .bible-page {
            transition: transform 0.5s ease;
          }
          .page-light {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
