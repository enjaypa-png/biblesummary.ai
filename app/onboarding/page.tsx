"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ONBOARDING_COMPLETE_KEY = "biblesummary_onboarding_complete";
const SUMMARY_INTENT_KEY = "biblesummary_summary_intent";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleContinue = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleRetentionChoice = (value: "yes" | "no") => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SUMMARY_INTENT_KEY, value);
    }
    setStep(4);
  };

  const handleContinueWithEmail = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    }
    router.push("/signup?redirect=/bible");
  };

  const buttonStyle =
    "w-full px-4 py-3 rounded-xl text-[15px] font-semibold transition-opacity active:opacity-90";
  const primaryButtonStyle = `${buttonStyle} text-white`;
  const cardStyle =
    "rounded-xl p-6 text-left transition-colors active:opacity-95 cursor-pointer";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
        {/* Screen 1 — Purpose */}
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
              Reading the Bible matters. Remembering it is hard.
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              BibleSummary.ai helps you retain what you read by providing
              neutral, book-level summaries — without interpretation.
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

        {/* Screen 2 — How it works */}
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
              How summaries work
            </h1>
            <ul
              className="mt-4 space-y-3 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                Read the full King James Version for free
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                Summaries are provided by book, organized by chapter ranges
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>•</span>
                Summaries describe what happens in the text, without theology
                or interpretation
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

        {/* Screen 3 — Retention question */}
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
              Retention
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              Would summaries help you retain what you read?
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleRetentionChoice("yes")}
                className={`${cardStyle} w-full flex items-center gap-3`}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <span className="text-xl">✅</span>
                <span className="text-[15px] font-medium">
                  Yes — help me retain what I read
                </span>
              </button>
              <button
                onClick={() => handleRetentionChoice("no")}
                className={`${cardStyle} w-full flex items-center gap-3`}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <span className="text-xl">👀</span>
                <span className="text-[15px] font-medium">
                  No — I&apos;ll just read for now
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Screen 4 — Account creation */}
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
              Save your progress
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: "var(--secondary)" }}
            >
              Create a free account to track where you left off and return
              anytime.
            </p>
            <button
              onClick={handleContinueWithEmail}
              className={`mt-10 ${primaryButtonStyle}`}
              style={{ backgroundColor: "var(--accent)" }}
            >
              Continue with email
            </button>
            <p
              className="mt-4 text-center text-[13px]"
              style={{ color: "var(--secondary)" }}
            >
              Already have an account?{" "}
              <Link
                href="/login?redirect=/bible"
                className="font-semibold"
                style={{ color: "var(--accent)" }}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
                  }
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div className="px-6 pb-8 flex justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              backgroundColor:
                s === step
                  ? "var(--accent)"
                  : s < step
                    ? "var(--accent)"
                    : "var(--border)",
              opacity: s === step ? 1 : s < step ? 0.5 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
