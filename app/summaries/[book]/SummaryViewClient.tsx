"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { parseSummaryMarkdown } from "@/lib/parseSummary";
import { useReadingSettings, themeStyles } from "@/contexts/ReadingSettingsContext";
import SummaryPaywall from "@/components/SummaryPaywall";

interface SummaryViewClientProps {
  bookId: string;
  bookName: string;
  bookSlug: string;
  summaryText: string;
}

/** Split text into chunks of roughly maxLen characters, breaking at paragraph boundaries. */
function chunkText(text: string, maxLen = 4000): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += (current ? "\n\n" : "") + para;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

type TtsState = "idle" | "loading" | "playing" | "paused";

export default function SummaryViewClient({
  bookId,
  bookName,
  bookSlug,
  summaryText,
}: SummaryViewClientProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const searchParams = useSearchParams();
  const { settings, openPanel } = useReadingSettings();
  const theme = themeStyles[settings.themeMode];

  // TTS state
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef(false);

  // Extract plain text from the summary for TTS
  const getPlainText = useCallback(() => {
    return summaryText
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^[-*]\s+/gm, "")
      .trim();
  }, [summaryText]);

  // Play a single chunk, returns true if finished successfully
  const playChunk = useCallback(async (text: string, voiceId?: string): Promise<boolean> => {
    if (abortRef.current) return false;

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId }),
    });

    if (!response.ok || abortRef.current) return false;

    const blob = await response.blob();
    if (abortRef.current) return false;

    const url = URL.createObjectURL(blob);
    const audio = audioRef.current;
    if (!audio) return false;
    audio.src = url;

    return new Promise<boolean>((resolve) => {
      const onEnded = () => { URL.revokeObjectURL(url); resolve(true); };
      const onError = () => { URL.revokeObjectURL(url); resolve(false); };
      audio.addEventListener("ended", onEnded, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.play().catch(() => { URL.revokeObjectURL(url); resolve(false); });
    });
  }, []);

  // Play all chunks sequentially
  const startPlayback = useCallback(async () => {
    const chunks = chunkText(getPlainText());
    abortRef.current = false;
    setTtsState("loading");
    const voiceId = settings.voiceId;

    for (let i = 0; i < chunks.length; i++) {
      if (abortRef.current) break;
      const ok = await playChunk(chunks[i], voiceId);
      if (i === 0 && !abortRef.current) setTtsState("playing");
      if (!ok) break;
    }

    if (!abortRef.current) {
      setTtsState("idle");
    }
  }, [getPlainText, playChunk, settings.voiceId]);

  function handleTtsToggle() {
    if (ttsState === "idle") {
      startPlayback();
    } else if (ttsState === "playing") {
      audioRef.current?.pause();
      setTtsState("paused");
    } else if (ttsState === "paused") {
      audioRef.current?.play();
      setTtsState("playing");
    } else if (ttsState === "loading") {
      abortRef.current = true;
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      setTtsState("idle");
    }
  }

  // Stop audio when unmounting / navigating away
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    async function checkAccess() {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);

      if (!user) {
        setHasAccess(false);
        return;
      }

      // If returning from Stripe checkout, verify the purchase first
      const sessionId = searchParams.get("session_id");
      if (searchParams.get("checkout") === "success" && sessionId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await fetch("/api/verify-purchase", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ sessionId }),
            });
          }
        } catch {
          // Verification failed — fall through to normal access check
        }
      }

      const { data, error } = await supabase.rpc("user_has_summary_access", {
        p_user_id: user.id,
        p_book_id: bookId,
      });

      if (error) {
        setHasAccess(false);
        return;
      }

      if (data) {
        // Record the view and check rate limit
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const viewRes = await fetch("/api/record-summary-view", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ bookId }),
            });
            const viewData = await viewRes.json();
            if (viewData.allowed === false) {
              setRateLimited(true);
              setHasAccess(false);
              return;
            }
          }
        } catch {
          // Rate limit check failed — allow access anyway
        }
      }

      setHasAccess(!!data);
    }
    checkAccess();
  }, [bookId, searchParams]);

  const { title, sections } = parseSummaryMarkdown(summaryText, bookName);

  // TTS button for the header
  function TtsButton() {
    const isActive = ttsState === "playing" || ttsState === "paused";
    return (
      <button
        onClick={handleTtsToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold active:opacity-70 transition-all"
        style={{
          backgroundColor: isActive ? "var(--accent)" : theme.card,
          color: isActive ? "white" : theme.text,
          border: isActive ? "none" : `1px solid ${theme.border}`,
        }}
      >
        {ttsState === "loading" ? (
          <>
            <div
              className="w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0"
              style={{ borderColor: theme.border, borderTopColor: "var(--accent)" }}
            />
            Loading...
          </>
        ) : ttsState === "playing" ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" className="flex-shrink-0">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            Pause
          </>
        ) : ttsState === "paused" ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" className="flex-shrink-0">
              <polygon points="6,4 20,12 6,20" />
            </svg>
            Resume
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Listen
          </>
        )}
      </button>
    );
  }

  // Settings gear button for the header
  function SettingsButton() {
    return (
      <button
        onClick={openPanel}
        title="Reading settings"
        className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70 transition-opacity"
        aria-label="Reading settings"
        style={{ backgroundColor: theme.card }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.secondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    );
  }

  if (hasAccess === null) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{
            backgroundColor: "var(--background-blur)",
            borderBottom: "0.5px solid var(--border)",
          }}
        >
          <Link
            href="/summaries"
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            ← Summaries
          </Link>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 flex justify-center">
          <span
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--accent)",
            }}
          />
        </main>
      </div>
    );
  }

  if (rateLimited) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{
            backgroundColor: "var(--background-blur)",
            borderBottom: "0.5px solid var(--border)",
          }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link
              href="/summaries"
              className="text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              ← Summaries
            </Link>
            <h1
              className="text-[15px] font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {bookName}
            </h1>
            <span className="w-[70px]" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 text-center">
          <p className="text-[15px]" style={{ color: "var(--secondary)" }}>
            Daily summary view limit reached. Please try again tomorrow.
          </p>
        </main>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{
            backgroundColor: "var(--background-blur)",
            borderBottom: "0.5px solid var(--border)",
          }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link
              href="/summaries"
              className="text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              ← Summaries
            </Link>
            <h1
              className="text-[15px] font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {bookName}
            </h1>
            <span className="w-[70px]" />
          </div>
        </header>
        <SummaryPaywall bookName={bookName} bookId={bookId} bookSlug={bookSlug} isAuthenticated={isAuthenticated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Persistent audio element for mobile-safe TTS playback */}
      <audio ref={audioRef} playsInline style={{ display: "none" }} preload="none" />
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--background-blur)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/summaries"
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            ← Summaries
          </Link>
          <h1
            className="text-[15px] font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {bookName}
          </h1>
          <div className="flex items-center gap-2">
            <TtsButton />
            <SettingsButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 pb-24">
        <div
          className="leading-relaxed"
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            color: "var(--foreground)",
          }}
        >
          <h2
            className="text-xl font-semibold mb-6"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h2>

          {sections.map((section, i) => (
            <section key={i} className="mb-8">
              <h3
                className="text-[12px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: "var(--accent)", fontFamily: "'Inter', sans-serif" }}
              >
                {section.label}
              </h3>
              <div className="space-y-3">
                {section.body.split(/\n\n+/).map((para, j) => (
                  <p
                    key={j}
                    className="text-[15px] leading-[1.7]"
                    style={{ color: "var(--foreground)" }}
                  >
                    {para.trim()}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
