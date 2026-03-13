"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "pwa_install_dismissed_at";
const INSTALLED_KEY = "pwa_installed";

type Platform = "android" | "ios" | "desktop" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  if (isIOS) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone: boolean }).standalone === true;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installing, setInstalling] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(INSTALLED_KEY)) return;

    // Don't show if dismissed recently (3 days)
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) return;
    }

    const p = getPlatform();
    setPlatform(p);

    // Catch the native install prompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // iOS — show our custom instructions after a short delay
    if (p === "ios") {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShow(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    
    const prompt = deferredPrompt as BeforeInstallPromptEvent;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "1");
    }
    setDeferredPrompt(null);
    setShow(false);
    setInstalling(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-50 px-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1.5px solid var(--border)",
          pointerEvents: "all",
          boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "0.5px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" fill="none" style={{ height: 36, width: "auto" }} role="img" aria-label="ClearBible.ai Logo">
              <rect x="4" y="6" width="42" height="52" rx="6" fill="#7c5cfc"/>
              <path d="M8 54 L8 56 C8 58 10 60 12 60 L40 60 C42 60 44 58 44 56 L44 54" fill="#e8e4f0" stroke="#d4d0e0" strokeWidth="0.5"/>
              <path d="M8 52 L8 54 C8 56 10 58 12 58 L40 58 C42 58 44 56 44 54 L44 52" fill="#f0ecf8" stroke="#d4d0e0" strokeWidth="0.5"/>
              <rect x="22" y="16" width="6" height="28" rx="1.5" fill="#f0c040"/>
              <rect x="15" y="23" width="20" height="6" rx="1.5" fill="#f0c040"/>
              <text x="58" y="34" fontFamily="'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fontSize="26" fontWeight="700" fill="#2d2b4e">ClearBible<tspan fill="#7c5cfc">.ai</tspan></text>
              <text x="58" y="48" fontFamily="'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fontSize="9" fontWeight="400" fill="#8b87a0">AI Verse Explanations &amp; Chapter Summaries</text>
              <text x="58" y="59" fontFamily="'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fontSize="9" fontWeight="400" fill="#8b87a0">AI Bible Ask/Search Feature</text>
            </svg>
            <div>
              <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
                Add to Home Screen
              </p>
              <p className="text-[12px]" style={{ color: "var(--foreground-secondary)" }}>
                Read the Bible anytime, offline
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-[20px] leading-none w-7 h-7 flex items-center justify-center rounded-full"
            style={{ color: "var(--foreground-secondary)", backgroundColor: "var(--background)" }}
          >
            ×
          </button>
        </div>

        {/* iOS instructions */}
        {platform === "ios" && (
          <div className="px-4 py-3">
            {!showIOSSteps ? (
              <button
                onClick={() => setShowIOSSteps(true)}
                className="w-full py-3 rounded-xl text-[14px] font-bold transition-all active:scale-[0.98]"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                Show me how
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                  3 easy steps:
                </p>
                {[
                  { icon: "⬆️", text: 'Tap the Share button at the bottom of your browser' },
                  { icon: "➕", text: 'Scroll down and tap "Add to Home Screen"' },
                  { icon: "✅", text: 'Tap "Add" — done!' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg" style={{ backgroundColor: "var(--background)" }}>
                    <span className="text-[18px]">{step.icon}</span>
                    <p className="text-[13px]" style={{ color: "var(--foreground)" }}>{step.text}</p>
                  </div>
                ))}
                <button
                  onClick={dismiss}
                  className="w-full mt-2 py-2 rounded-xl text-[13px] font-medium"
                  style={{ color: "var(--foreground-secondary)", backgroundColor: "var(--background)", border: "0.5px solid var(--border)" }}
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        )}

        {/* Android / Desktop native prompt */}
        {(platform === "android" || platform === "desktop") && deferredPrompt && (
          <div className="px-4 py-3 flex gap-2">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 py-3 rounded-xl text-[14px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)", color: "white" }}
            >
              {installing ? "Installing..." : "Install App"}
            </button>
            <button
              onClick={dismiss}
              className="px-4 py-3 rounded-xl text-[14px] font-medium"
              style={{ backgroundColor: "var(--background)", color: "var(--foreground-secondary)", border: "0.5px solid var(--border)" }}
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
