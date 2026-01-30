"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasSeenIntro } from "@/lib/intro-state";

/**
 * Root Page
 * 
 * Checks if user has seen the intro and routes accordingly:
 * - First visit: /intro (opening experience)
 * - Returning: /bible (main app)
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check intro state
    const seenIntro = hasSeenIntro();

    if (seenIntro) {
      // Returning user - go straight to Bible
      router.push('/bible');
    } else {
      // First-time user - show intro
      router.push('/intro');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <style jsx>{`
        .loading-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(212, 175, 55, 0.2);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
