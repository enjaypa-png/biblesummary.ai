"use client";

import { useState, useEffect } from "react";

const LOADING_STEPS = [
  "Searching Scripture...",
  "Analyzing passages...",
  "Preparing explanation...",
];

export default function AISearchLoading() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ animation: "aiSearchFadeIn 0.3s ease-out" }}>
      <style>{`
        @keyframes aiSearchFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aiSearchShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes aiSearchDotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          padding: "20px 22px",
          borderRadius: 16,
          background: "var(--card, #f9fafb)",
          border: "1px solid var(--border, rgba(0,0,0,0.08))",
          borderLeft: "3px solid var(--accent, #7c5cfc)",
        }}
      >
        {/* Shimmer skeleton lines */}
        <div style={{ marginBottom: 18 }}>
          {[100, 88, 65].map((w, i) => (
            <div
              key={i}
              style={{
                height: 12,
                width: `${w}%`,
                borderRadius: 99,
                marginBottom: i < 2 ? 10 : 0,
                background: "linear-gradient(90deg, var(--border, #e5e7eb) 25%, var(--card, #f3f4f6) 50%, var(--border, #e5e7eb) 75%)",
                backgroundSize: "200% 100%",
                animation: `aiSearchShimmer 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {LOADING_STEPS.map((step, i) => (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: i <= activeStep ? 1 : 0.35,
                transition: "opacity 0.4s ease",
              }}
            >
              {i < activeStep ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent, #7c5cfc)">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              ) : i === activeStep ? (
                <span style={{ display: "inline-flex", gap: 2 }}>
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "var(--accent, #7c5cfc)",
                        display: "inline-block",
                        animation: "aiSearchDotPulse 1.4s ease-in-out infinite",
                        animationDelay: `${d * 0.2}s`,
                      }}
                    />
                  ))}
                </span>
              ) : (
                <span style={{ width: 14, height: 14, display: "inline-block" }} />
              )}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: i === activeStep ? 600 : 400,
                  color: i <= activeStep ? "var(--foreground, #1a1a1a)" : "var(--secondary, #9ca3af)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
