"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { markIntroComplete } from "@/lib/intro-state";
import BibleCover from "./components/BibleCover";
import AudioWelcome from "./components/AudioWelcome";
import OpeningTransition from "./components/OpeningTransition";
import GenesisReading from "./components/GenesisReading";

type IntroPhase = 'cover' | 'welcome' | 'transition' | 'genesis' | 'complete';

/**
 * Intro Page
 * 
 * Orchestrates the entire opening experience flow.
 * Only shown to first-time users.
 */
export default function IntroPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<IntroPhase>('cover');
  const [genesisText, setGenesisText] = useState<string>(
    "In the beginning God created the heaven and the earth."
  );

  useEffect(() => {
    // Fetch Genesis 1:1 from Supabase
    fetchGenesisVerse();
  }, []);

  const fetchGenesisVerse = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not found, using fallback text');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: book } = await supabase
        .from('books')
        .select('id')
        .eq('slug', 'genesis')
        .single();

      if (book) {
        const { data: verse } = await supabase
          .from('verses')
          .select('text')
          .eq('book_id', book.id)
          .eq('chapter', 1)
          .eq('verse', 1)
          .single();

        if (verse) {
          setGenesisText(verse.text);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Genesis verse:', error);
      // Use fallback text (already set in state)
    }
  };

  const handlePhaseComplete = (currentPhase: IntroPhase) => {
    switch (currentPhase) {
      case 'cover':
        setPhase('welcome');
        break;
      case 'welcome':
        setPhase('transition');
        break;
      case 'transition':
        setPhase('genesis');
        break;
      case 'genesis':
        completeIntro(false);
        break;
    }
  };

  const completeIntro = (skipped: boolean = false) => {
    // Mark intro as complete
    markIntroComplete(skipped);

    // Redirect to main app
    router.push('/bible');
  };

  const handleSkip = () => {
    completeIntro(true);
  };

  return (
    <div className="intro-page">
      {/* Phase 1: Bible Cover */}
      {phase === 'cover' && (
        <BibleCover onComplete={() => handlePhaseComplete('cover')} />
      )}

      {/* Phase 2: Audio Welcome */}
      {phase === 'welcome' && (
        <AudioWelcome onComplete={() => handlePhaseComplete('welcome')} />
      )}

      {/* Phase 3: Opening Transition */}
      {phase === 'transition' && (
        <OpeningTransition onComplete={() => handlePhaseComplete('transition')} />
      )}

      {/* Phase 4: Genesis Reading */}
      {phase === 'genesis' && (
        <GenesisReading 
          verseText={genesisText}
          onComplete={() => handlePhaseComplete('genesis')} 
        />
      )}

      {/* Global Skip Button (visible on all phases except genesis) */}
      {phase !== 'genesis' && (
        <button 
          onClick={handleSkip}
          className="global-skip-button"
          aria-label="Skip introduction"
        >
          Skip Introduction
        </button>
      )}

      <style jsx>{`
        .intro-page {
          position: fixed;
          inset: 0;
          overflow: hidden;
        }

        .global-skip-button {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #f5f5dc;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .global-skip-button:hover {
          background: rgba(0, 0, 0, 0.7);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .global-skip-button:active {
          transform: scale(0.95);
        }

        /* Mobile adjustments */
        @media (max-width: 640px) {
          .global-skip-button {
            top: 0.5rem;
            right: 0.5rem;
            font-size: 0.75rem;
            padding: 0.4rem 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}
