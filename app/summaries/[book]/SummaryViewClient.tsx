"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { parseSummaryMarkdown } from "@/lib/parseSummary";
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
  const playChunk = useCallback(async (text: string): Promise<boolean> => {
    if (abortRef.current) return false;

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok || abortRef.current) return false;

    const blob = await response.blob();
    if (abortRef.current) return false;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    return new Promise<boolean>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve(true);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      audio.play().catch(() => resolve(false));
    });
  }, []);

  // Play all chunks sequentially
  const startPlayback = useCallback(async () => {
    const chunks = chunkText(getPlainText());
    abortRef.current = false;
    setTtsState("loading");

    for (let i = 0; i < chunks.length; i++) {
      if (abortRef.current) break;
      const ok = await playChunk(chunks[i]);
      if (i === 0 && !abortRef.current) setTtsState("playing");
      if (!ok) break;
    }

    if (!abortRef.current) {
      setTtsState("idle");
      audioRef.current = null;
    }
  }, [getPlainText, playChunk]);

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
      audioRef.current?.pause();
      audioRef.current = null;
      setTtsState("idle");
    }
  }

  // Stop audio when unmounting / navigating away
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
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
    return (
      <button
        onClick={handleTtsToggle}
        title={
          ttsState === "idle" ? "Listen to summary" :
          ttsState === "loading" ? "Cancel" :
          ttsState === "playing" ? "Pause" : "Resume"
        }
        className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70 transition-all"
        style={{
          backgroundColor: ttsState === "playing" || ttsState === "paused" ? "var(--accent)" : "var(--card)",
          border: ttsState === "idle" ? "0.5px solid var(--border)" : "none",
        }}
      >
        {ttsState === "loading" ? (
          <div
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
          />
        ) : ttsState === "playing" ? (
          /* Pause icon */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : ttsState === "paused" ? (
          /* Play icon (resume) */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        ) : (
          /* Speaker / play icon (idle) */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
        )}
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
          <TtsButton />
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
