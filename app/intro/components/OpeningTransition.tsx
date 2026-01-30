"use client";

import { useEffect, useState } from "react";

interface OpeningTransitionProps {
  onComplete: () => void;
  duration?: number;
}

/**
 * Enhanced Opening Transition Component
 * 
 * Animates a THICK Bible opening toward the viewer.
 * Shows realistic pages with texture and gold edges.
 * Light spills between the pages.
 * Includes subtle page-turn sound effect.
 */
export default function OpeningTransition({ 
  onComplete, 
  duration = 6000 
}: OpeningTransitionProps) {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open'>('closed');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    // Play page-turn sound
    const audio = new Audio('/audio/page-turn.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore if audio fails
    });

    // Animation sequence
    setTimeout(() => setPhase('opening'), 500);
    setTimeout(() => setPhase('open'), duration * 0.7);

    // Complete
    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div className="opening-transition-screen">
      {/* Background light effect */}
      <div className={`light-spill ${phase === 'opening' || phase === 'open' ? 'visible' : ''}`} />

      {/* The Bible opening */}
      <div className="bible-container">
        {/* Left page (static) */}
        <div className="page left-page">
          {/* Page texture */}
          <div className="page-texture" />
          
          {/* Text lines */}
          <div className="page-content">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="text-line"
                style={{
                  width: `${60 + Math.random() * 35}%`,
                  marginLeft: i === 0 ? '20%' : '0', // First line indented
                }}
              />
            ))}
          </div>

          {/* Gold edge on left */}
          <div className="page-edge left-edge" />
        </div>

        {/* Right page (opening/turning) */}
        <div 
          className={`page right-page ${phase}`}
          style={{
            transform: reducedMotion 
              ? 'none'
              : phase === 'closed'
              ? 'perspective(1200px) rotateY(0deg)'
              : phase === 'opening'
              ? 'perspective(1200px) rotateY(-120deg)'
              : 'perspective(1200px) rotateY(-180deg)',
          }}
        >
          {/* Page texture */}
          <div className="page-texture" />
          
          {/* Text lines */}
          <div className="page-content">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="text-line"
                style={{
                  width: `${60 + Math.random() * 35}%`,
                  marginLeft: i === 0 ? '20%' : '0',
                }}
              />
            ))}
          </div>

          {/* Gold edge on right */}
          <div className="page-edge right-edge" />
        </div>

        {/* Center spine shadow */}
        <div className="spine-shadow" />

        {/* Thick page stack (showing depth) */}
        <div className="page-stack left-stack">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="stack-layer"
              style={{
                transform: `translateX(-${i * 1.5}px) translateZ(-${i * 2}px)`,
                opacity: 1 - (i * 0.08),
              }}
            />
          ))}
        </div>

        <div className="page-stack right-stack">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="stack-layer"
              style={{
                transform: `translateX(${i * 1.5}px) translateZ(-${i * 2}px)`,
                opacity: 1 - (i * 0.08),
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .opening-transition-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to bottom, #0a0a0a 0%, #1a1410 50%, #0a0a0a 100%);
          overflow: hidden;
          perspective: 1500px;
        }

        /* Light spilling from pages */
        .light-spill {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 400px;
          height: 400px;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 240, 200, 0.15) 0%,
            rgba(255, 230, 180, 0.08) 30%,
            transparent 70%
          );
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 1.5s ease;
          pointer-events: none;
          filter: blur(30px);
        }

        .light-spill.visible {
          opacity: 1;
        }

        /* Bible container */
        .bible-container {
          position: relative;
          width: 600px;
          height: 420px;
          transform-style: preserve-3d;
        }

        /* Individual page */
        .page {
          position: absolute;
          width: 300px;
          height: 420px;
          background: linear-gradient(
            to bottom,
            #f8f5ed 0%,
            #f5f2e8 50%,
            #f0ede3 100%
          );
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        .left-page {
          left: 0;
          border-radius: 2px 0 0 2px;
          transform-origin: right center;
        }

        .right-page {
          right: 0;
          border-radius: 0 2px 2px 0;
          transform-origin: left center;
          transition: ${reducedMotion ? 'none' : 'transform 3s cubic-bezier(0.4, 0, 0.2, 1)'};
        }

        /* Page texture */
        .page-texture {
          position: absolute;
          inset: 0;
          background-image: 
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1.8rem,
              rgba(0, 0, 0, 0.02) 1.8rem,
              rgba(0, 0, 0, 0.02) calc(1.8rem + 1px)
            );
          opacity: 0.6;
          pointer-events: none;
        }

        /* Page content (text lines) */
        .page-content {
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .text-line {
          height: 2px;
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.08),
            rgba(0, 0, 0, 0.15)
          );
          border-radius: 1px;
        }

        /* Gold edges */
        .page-edge {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 8px;
          background: linear-gradient(
            to bottom,
            #c9a84c 0%,
            #f4e4a6 30%,
            #c9a84c 50%,
            #f4e4a6 70%,
            #c9a84c 100%
          );
          box-shadow: 
            0 0 8px rgba(201, 168, 76, 0.4),
            inset 0 0 4px rgba(255, 255, 255, 0.3);
        }

        .left-edge {
          left: 0;
          border-radius: 2px 0 0 2px;
        }

        .right-edge {
          right: 0;
          border-radius: 0 2px 2px 0;
        }

        /* Center spine shadow */
        .spine-shadow {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 4px;
          transform: translateX(-50%);
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.3),
            transparent,
            rgba(0, 0, 0, 0.3)
          );
          z-index: 10;
        }

        /* Page stacks (showing thickness) */
        .page-stack {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 300px;
          transform-style: preserve-3d;
          pointer-events: none;
        }

        .left-stack {
          left: 0;
        }

        .right-stack {
          right: 0;
        }

        .stack-layer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            #f0ede3 0%,
            #ebe8de 50%,
            #e6e3d9 100%
          );
          border-radius: 2px;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .bible-container {
            width: 400px;
            height: 280px;
            transform: scale(0.8);
          }

          .page {
            width: 200px;
            height: 280px;
          }

          .page-content {
            padding: 2rem 1.5rem;
            gap: 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .bible-container {
            width: 320px;
            height: 224px;
            transform: scale(0.7);
          }

          .page {
            width: 160px;
            height: 224px;
          }

          .page-content {
            padding: 1.5rem 1rem;
            gap: 1rem;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .right-page {
            transition: none;
          }

          .light-spill {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
