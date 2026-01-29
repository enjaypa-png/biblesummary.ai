"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { markIntroComplete } from "@/lib/intro-state";
import BibleCover from "./components/BibleCover";
import AudioWelcome from "./components/AudioWelcome";
import OpeningTransition from "./components/OpeningTransition";
import GenesisReading from "./components/GenesisReading";

type Phase = "cover" | "welcome" | "transition" | "genesis";

export default function IntroPage() {
  const [phase, setPhase] = useState<Phase>("cover");
  const router = useRouter();

  const finishIntro = useCallback(() => {
    markIntroComplete();
    router.replace("/bible");
  }, [router]);

  const handleSkip = useCallback(() => {
    finishIntro();
  }, [finishIntro]);

  const advanceTo = useCallback(
    (next: Phase | "done") => {
      if (next === "done") {
        finishIntro();
      } else {
        setPhase(next);
      }
    },
    [finishIntro]
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      {/* Skip button — always visible */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 z-50 px-4 py-2 text-sm rounded-full transition-colors"
        style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.6)",
        }}
        aria-label="Skip introduction"
      >
        Skip
      </button>

      <AnimatePresence mode="wait">
        {phase === "cover" && (
          <BibleCover
            key="cover"
            onComplete={() => advanceTo("welcome")}
          />
        )}
        {phase === "welcome" && (
          <AudioWelcome
            key="welcome"
            onComplete={() => advanceTo("transition")}
          />
        )}
        {phase === "transition" && (
          <OpeningTransition
            key="transition"
            onComplete={() => advanceTo("genesis")}
          />
        )}
        {phase === "genesis" && (
          <GenesisReading
            key="genesis"
            onComplete={() => advanceTo("done")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
