"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const STEPS = [
  {
    emoji: "📖",
    title: "Welcome to ClearBible.ai",
    subtitle: "The Bible in plain, clear English — finally easy to understand.",
    body: "Read the full Bible free in two translations: the Clear Bible Translation (modern English) and the King James Version. Listen to audio, take notes, and highlight as you go.",
    cta: "Get Started",
  },
  {
    emoji: "✨",
    title: "Understand every verse — instantly",
    subtitle: "Tap any verse to get a plain-language explanation.",
    body: "No theological jargon. No confusing language. Just a clear, simple explanation of what the verse means — right there in the reading experience. Your first 3 explanations are free.",
    cta: "That sounds great",
  },
  {
    emoji: "🙏",
    title: "Where would you like to start?",
    subtitle: "Pick a starting point — you can always change it later.",
    body: null,
    cta: null,
    picks: [
      { label: "New to the Bible", sub: "Start with the Gospel of John", href: "/bible/john/1" },
      { label: "Back to basics", sub: "Start at the beginning — Genesis", href: "/bible/genesis/1" },
      { label: "I'll pick my own", sub: "Browse all 66 books", href: "/bible" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  async function completeOnboarding(href: string) {
    setCompleting(true);
    localStorage.setItem("onboarding_completed", "true");
    // Persist server-side so returning users on other devices skip onboarding
    try {
      await supabase.auth.updateUser({ data: { onboarding_completed: true } });
    } catch {
      // non-critical — localStorage will still work on this device
    }
    router.replace(href);
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === step ? "var(--accent)" : "var(--border)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
      >
        <div style={{ fontSize: 56, marginBottom: 20 }}>{current.emoji}</div>

        <h1
          className="text-[22px] font-bold mb-3"
          style={{ color: "var(--foreground)", fontFamily: "Georgia, serif" }}
        >
          {current.title}
        </h1>

        <p
          className="text-[15px] font-medium mb-4"
          style={{ color: "var(--accent)" }}
        >
          {current.subtitle}
        </p>

        {current.body && (
          <p
            className="text-[14px] leading-relaxed mb-8"
            style={{ color: "var(--foreground-secondary)" }}
          >
            {current.body}
          </p>
        )}

        {/* Starting point picks (last step) */}
        {current.picks && (
          <div className="space-y-3 mt-6">
            {current.picks.map((pick) => (
              <button
                key={pick.href}
                onClick={() => completeOnboarding(pick.href)}
                disabled={completing}
                className="w-full p-4 rounded-xl text-left transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--background)",
                  border: "0.5px solid var(--border)",
                }}
              >
                <div className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
                  {pick.label}
                </div>
                <div className="text-[13px]" style={{ color: "var(--foreground-secondary)" }}>
                  {pick.sub}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* CTA button (non-last steps) */}
        {current.cta && !isLast && (
          <button
            onClick={() => setStep(step + 1)}
            className="w-full py-3.5 rounded-xl text-[16px] font-bold mt-2 transition-all active:scale-[0.98]"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            {current.cta}
          </button>
        )}
      </div>

      {/* Skip */}
      {!isLast && (
        <button
          onClick={() => completeOnboarding("/bible")}
          className="mt-6 text-[13px]"
          style={{ color: "var(--foreground-secondary)" }}
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
