"use client";

import { useEffect, useState } from "react";

interface BibleCoverProps {
  onComplete: () => void;
  duration?: number;
}

/**
 * Enhanced Bible Cover Component
 * 
 * Displays a THICK, substantial Bible with gold-gilded page edges.
 * Emphasizes the depth and weight of Scripture.
 * Subtle breathing animation with reverent atmosphere.
 */
export default function BibleCover({ onComplete, duration = 4000 }: BibleCoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    // Fade in
    setTimeout(() => setIsVisible(true), 100);

    // Auto-advance
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
          transition: 'opacity 1.2s ease-in',
        }}
      >
        {/* Ambient candlelight glow */}
        <div className="ambient-glow" />

        {/* The Bible - THICK with visible depth */}
        <div className={`bible-book ${reducedMotion ? '' : 'breathing'}`}>
          {/* Front cover */}
          <div className="bible-front-cover">
            {/* Leather texture overlay */}
            <div className="leather-texture" />
            
            {/* Worn edges and scratches */}
            <div className="wear-marks" />

            {/* Gold embossed title */}
            <div className="title-container">
              <h1 className="bible-title">Holy Bible</h1>
              <div className="title-underline" />
            </div>

            {/* Corner decorations */}
            <div className="corner-decoration top-left" />
            <div className="corner-decoration top-right" />
            <div className="corner-decoration bottom-left" />
            <div className="corner-decoration bottom-right" />
          </div>

          {/* Spine (showing thickness) */}
          <div className="bible-spine">
            <div className="spine-text">HOLY BIBLE</div>
          </div>

          {/* Gold-gilded page edges (the key visual!) */}
          <div className="page-edges">
            {/* Individual page layers for depth */}
            {[...Array(12)].map((_, i) => (
              <div 
                key={i}
                className="page-layer"
                style={{
                  transform: `translateX(${i * 0.5}px)`,
                  opacity: 1 - (i * 0.05),
                }}
              />
            ))}
            
            {/* Gold gilding on top edge */}
            <div className="gold-gilding" />
          </div>

          {/* Shadow underneath (showing weight) */}
          <div className="bible-shadow" />
        </div>

        {/* Floating dust particles (optional, subtle) */}
        <div className="dust-particles">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="dust-particle"
              style={{
                left: `${20 + i * 10}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + i * 0.5}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .bible-cover-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1410 50%, #0a0a0a 100%);
          overflow: hidden;
        }

        .bible-cover-container {
          position: relative;
          width: 100%;
          max-width: 500px;
          height: 100%;
          max-height: 700px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        /* Ambient candlelight glow */
        .ambient-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 600px;
          height: 600px;
          background: radial-gradient(
            circle,
            rgba(255, 200, 100, 0.08) 0%,
            rgba(255, 180, 80, 0.04) 30%,
            transparent 70%
          );
          transform: translate(-50%, -50%);
          animation: ${reducedMotion ? 'none' : 'pulse 4s ease-in-out infinite'};
          pointer-events: none;
        }

        /* The Bible book */
        .bible-book {
          position: relative;
          width: 320px;
          height: 440px;
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        .bible-book.breathing {
          animation: breathe 6s ease-in-out infinite;
        }

        /* Front cover */
        .bible-front-cover {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            145deg,
            #3d2817 0%,
            #5c3d2e 30%,
            #4a2f1e 60%,
            #2d1810 100%
          );
          border-radius: 4px 8px 8px 4px;
          box-shadow: 
            0 30px 80px rgba(0, 0, 0, 0.8),
            inset 0 2px 4px rgba(255, 255, 255, 0.05),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(80, 50, 30, 0.5);
          overflow: hidden;
        }

        /* Leather texture */
        .leather-texture {
          position: absolute;
          inset: 0;
          background-image: 
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 3px,
              rgba(0, 0, 0, 0.08) 3px,
              rgba(0, 0, 0, 0.08) 6px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(0, 0, 0, 0.06) 3px,
              rgba(0, 0, 0, 0.06) 6px
            );
          opacity: 0.4;
          mix-blend-mode: multiply;
        }

        /* Wear marks */
        .wear-marks {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 20% 30%, rgba(0, 0, 0, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(0, 0, 0, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, rgba(0, 0, 0, 0.1) 0%, transparent 40%);
        }

        /* Title container */
        .title-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          width: 80%;
        }

        .bible-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #d4af37;
          text-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.8),
            0 0 30px rgba(212, 175, 55, 0.4),
            0 1px 0 rgba(255, 220, 120, 0.3);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin: 0;
          position: relative;
          /* Embossed effect */
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
        }

        .title-underline {
          width: 60%;
          height: 2px;
          background: linear-gradient(
            to right,
            transparent,
            #d4af37,
            transparent
          );
          margin: 1rem auto 0;
          box-shadow: 0 1px 4px rgba(212, 175, 55, 0.5);
        }

        /* Corner decorations */
        .corner-decoration {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 2px solid rgba(212, 175, 55, 0.4);
        }

        .corner-decoration.top-left {
          top: 20px;
          left: 20px;
          border-right: none;
          border-bottom: none;
        }

        .corner-decoration.top-right {
          top: 20px;
          right: 20px;
          border-left: none;
          border-bottom: none;
        }

        .corner-decoration.bottom-left {
          bottom: 20px;
          left: 20px;
          border-right: none;
          border-top: none;
        }

        .corner-decoration.bottom-right {
          bottom: 20px;
          right: 20px;
          border-left: none;
          border-top: none;
        }

        /* Spine (showing thickness) */
        .bible-spine {
          position: absolute;
          left: -30px;
          top: 0;
          bottom: 0;
          width: 30px;
          background: linear-gradient(
            to right,
            #1a0f08 0%,
            #2d1810 30%,
            #3d2817 50%,
            #2d1810 70%,
            #1a0f08 100%
          );
          border-radius: 4px 0 0 4px;
          box-shadow: 
            inset -2px 0 8px rgba(0, 0, 0, 0.5),
            -5px 0 20px rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spine-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-family: 'Georgia', serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: #d4af37;
          letter-spacing: 0.2em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        /* Gold-gilded page edges (THE KEY VISUAL!) */
        .page-edges {
          position: absolute;
          right: -12px;
          top: 8px;
          bottom: 8px;
          width: 12px;
          background: linear-gradient(
            to right,
            #c9a84c 0%,
            #f4e4a6 50%,
            #c9a84c 100%
          );
          border-radius: 0 2px 2px 0;
          box-shadow: 
            inset -1px 0 2px rgba(0, 0, 0, 0.2),
            2px 0 8px rgba(201, 168, 76, 0.6);
          overflow: hidden;
        }

        .page-layer {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.3) 0%,
            rgba(201, 168, 76, 0.8) 50%,
            rgba(0, 0, 0, 0.2) 100%
          );
        }

        .gold-gilding {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(255, 240, 180, 0.4) 50%,
            transparent 100%
          );
          animation: ${reducedMotion ? 'none' : 'shimmer 3s ease-in-out infinite'};
        }

        /* Shadow (showing weight) */
        .bible-shadow {
          position: absolute;
          bottom: -40px;
          left: 10%;
          right: 10%;
          height: 40px;
          background: radial-gradient(
            ellipse at center,
            rgba(0, 0, 0, 0.6) 0%,
            rgba(0, 0, 0, 0.3) 50%,
            transparent 100%
          );
          filter: blur(15px);
        }

        /* Dust particles */
        .dust-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .dust-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(255, 220, 150, 0.3);
          border-radius: 50%;
          animation: float-up linear infinite;
        }

        /* Animations */
        @keyframes breathe {
          0%, 100% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.015) translateY(-3px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes float-up {
          from {
            transform: translateY(100vh);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          to {
            transform: translateY(-20vh);
            opacity: 0;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .bible-book {
            width: 260px;
            height: 360px;
          }

          .bible-title {
            font-size: 2rem;
          }

          .bible-spine {
            left: -25px;
            width: 25px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .bible-book.breathing,
          .ambient-glow,
          .gold-gilding,
          .dust-particle {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
