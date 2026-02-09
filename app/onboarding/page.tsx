"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, supabase } from "@/lib/supabase";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user && user.email_confirmed_at) {
        setAuthed(true);
      } else {
        router.replace("/login?redirect=/onboarding");
      }
      setLoading(false);
    });
  }, [router]);

  const handleContinue = () => {
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleRetentionChoice = async (value: "yes" | "no") => {
    if (value === "no") {
      await completeOnboarding(false);
      router.push("/bible");
      return;
    }
    setStep(7);
  };

  const handleViewOptions = async () => {
    await completeOnboarding(true);
    router.push("/summaries");
  };

  const handleContinueWithoutSummaries = async () => {
    await completeOnboarding(false);
    router.push("/bible");
  };

  async function completeOnboarding(summaryIntent: boolean) {
    const user = await getCurrentUser();
    if (!user) return;

    await supabase.from("user_profiles").upsert({
      user_id: user.id,
      summary_intent: summaryIntent,
      onboarding_completed_at: new Date().toISOString(),
    });
  }

  const buttonStyle =
    "w-full px-4 py-3 rounded-xl text-[15px] font-semibold transition-opacity active:opacity-90";
  const primaryButtonStyle = `${buttonStyle} text-white`;
  const cardStyle =
    "rounded-xl p-4 text-left transition-colors active:opacity-95 cursor-pointer w-full flex items-start gap-3";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <p className="text-[14px]" style={{ color: "var(--secondary)" }}>Loading...</p>
      </div>
    );
  }

  if (!authed) return null;

  const totalSteps = 7;
  const showStep6 = step === 6;
  const showStep7 = step === 7;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
        {/* Screen 1 — Problem Awareness */}
        {step === 1 && (
          <div>
            <h1
              className="font-semibold tracking-tight leading-tight"
              style={{
                color: "var(--foreground)",
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "clamp(1.5rem, 5vw, 1.75rem)",
              }}
            >
              Reading the Bible matters. Remembering it is difficult.
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              Many people read consistently but struggle to remember what they&apos;ve already read—especially across long books.
            </p>
            <p
              className="mt-3 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              BibleSummary.ai bridges that gap.
            </p>
            <button
              onClick={handleContinue}
              className={`mt-10 ${primaryButtonStyle}`}
              style={{ backgroundColor: "var(--accent)" }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Screen 2 — Value Proposition */}
        {step === 2 && (
          <div>
            <h1
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "clamp(1.5rem, 5vw, 1.75rem)",
              }}
            >
              Understand what you read — without added meaning.
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              Summaries describe what happens in the text, clearly and neutrally.
            </p>
            <p
              className="mt-3 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              No opinions. No added meaning. No explanations layered on top of Scripture.
            </p>
            <p
              className="mt-3 text-[15px] leading-relaxed font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Just structure, context, and recall.
            </p>
            <button
              onClick={handleContinue}
              className={`mt-10 ${primaryButtonStyle}`}
              style={{ backgroundColor: "var(--accent)" }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Screen 3 — Retention Framing */}
        {step === 3 && (
          <div>
            <h1
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "clamp(1.5rem, 5vw, 1.75rem)",
              }}
            >
              Retention changes how you read.
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              Readers who understand the overall structure of a book retain more as they read chapter by chapter.
            </p>
            <p
              className="mt-3 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              Summaries give you that structure — before or after you read.
            </p>
            <button
              onClick={handleContinue}
              className={`mt-10 ${primaryButtonStyle}`}
              style={{ backgroundColor: "var(--accent)" }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Screen 4 — Trust + Transparency */}
        {step === 4 && (
          <div>
            <h1
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "clamp(1.5rem, 5vw, 1.75rem)",
              }}
            >
              What&apos;s free — and what&apos;s not.
            </h1>
            <ul
              className="mt-4 space-y-3 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                Reading the full King James Version is always free
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                Listening to audio is always free
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                Summaries are a paid feature that supports this project
              </li>
            </ul>
            <p
              className="mt-4 text-[15px] font-medium"
              style={{ color: "var(--foreground)" }}
            >
              You never pay to read Scripture.
            </p>
            <button
              onClick={handleContinue}
              className={`mt-10 ${primaryButtonStyle}`}
              style={{ backgroundColor: "var(--accent)" }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Screen 5 — Product Clarity */}
        {step === 5 && (
          <div>
            <h1
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "clamp(1.5rem, 5vw, 1.75rem)",
              }}
            >
              How summaries work.
            </h1>
            <ul
              className="mt-4 space-y-3 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                One summary per book
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                Organized by chapter ranges
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                Designed to be referenced while reading
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                Available anytime once unlocked
              </li>
            </ul>
            <button
              onClick={handleContinue}
              className={`mt-10 ${primaryButtonStyle}`}
              style={{ backgroundColor: "var(--accent)" }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Screen 6 — Decision Point */}
        {showStep6 && (
          <div>
            <h1
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "clamp(1.5rem, 5vw, 1.75rem)",
              }}
            >
              Would summaries help you retain what you read?
            </h1>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => handleRetentionChoice("yes")}
                className={cardStyle}
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  border: "none",
                }}
              >
                <span className="text-lg flex-shrink-0">✓</span>
                <span className="text-[15px] font-medium text-left">
                  Yes — help me retain what I read
                </span>
              </button>
              <button
                onClick={() => handleRetentionChoice("no")}
                className={cardStyle}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <span className="text-[15px] font-medium">
                  No — I&apos;ll read without summaries for now
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Screen 7 — Upgrade CTA (only if Yes on Screen 6) */}
        {showStep7 && (
          <div>
            <h1
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: "clamp(1.5rem, 5vw, 1.75rem)",
              }}
            >
              Unlock Bible summaries.
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              Summaries are available by book or as a lifetime unlock.
            </p>
            <p
              className="mt-2 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              Choose the option that fits how you read.
            </p>
            <button
              onClick={handleViewOptions}
              className={`mt-8 ${primaryButtonStyle}`}
              style={{ backgroundColor: "var(--accent)" }}
            >
              View options
            </button>
            <button
              onClick={handleContinueWithoutSummaries}
              className="mt-4 text-[13px] font-medium w-full py-2"
              style={{ color: "var(--secondary)" }}
            >
              Continue without summaries
            </button>
          </div>
        )}
      </div>

      {/* Progress dots */}
      {!showStep6 && !showStep7 && (
        <div className="px-6 pb-8 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                backgroundColor:
                  s === step ? "var(--accent)" : s < step ? "var(--accent)" : "var(--border)",
                opacity: s === step ? 1 : s < step ? 0.5 : 0.3,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
