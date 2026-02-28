"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { useReadingSettings, themeStyles } from "@/contexts/ReadingSettingsContext";
import SummaryPaywall from "@/components/SummaryPaywall";

interface Props {
  bookName: string;
  bookSlug: string;
  bookId: string;
  summaryText: string | null;
}

function renderMarkdown(text: string, theme: { text: string; secondary: string; border: string }, fontStack: string) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let currentParagraph: string[] = [];
  let key = 0;

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const raw = currentParagraph.join(" ");
      elements.push(
        <p key={key++} className="mb-5" style={{ color: theme.text }}>
          {renderInline(raw)}
        </p>
      );
      currentParagraph = [];
    }
  }

  function renderInline(text: string): (string | JSX.Element)[] {
    const parts: (string | JSX.Element)[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={`b-${match.index}`} style={{ fontWeight: 600 }}>
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      continue;
    }

    // H1: Book title — skip (we render our own header)
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      flushParagraph();
      continue;
    }

    // H2: Section heading
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      const headingText = trimmed.replace(/^## /, "");
      elements.push(
        <h2
          key={key++}
          className="text-[18px] font-semibold mt-10 mb-4 pb-2"
          style={{
            color: theme.text,
            borderBottom: `1px solid ${theme.border}`,
            fontFamily: fontStack,
          }}
        >
          {headingText}
        </h2>
      );
      continue;
    }

    currentParagraph.push(trimmed);
  }

  flushParagraph();
  return elements;
}

export default function SummaryClient({ bookName, bookSlug, bookId, summaryText }: Props) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const { settings, openPanel } = useReadingSettings();
  const theme = themeStyles[settings.themeMode];
  const searchParams = useSearchParams();

  const getFontStack = (fontFamily: string) => {
    switch (fontFamily) {
      case "Libre Baskerville":
        return "'Libre Baskerville', serif";
      case "Spectral":
        return "'Spectral', serif";
      case "Source Sans 3":
        return "'Source Sans 3', sans-serif";
      case "System":
        return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      default:
        return "'Libre Baskerville', serif";
    }
  };
  const fontStack = getFontStack(settings.fontFamily);

  // TTS state
  type TtsState = "idle" | "loading" | "playing" | "paused";
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef(false);

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

  const getPlainText = useCallback(() => {
    if (!summaryText) return "";
    return summaryText
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^[-*]\s+/gm, "")
      .trim();
  }, [summaryText]);

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
    if (!abortRef.current) { setTtsState("idle"); }
  }, [getPlainText, playChunk, settings.voiceId]);

  function handleTtsToggle() {
    if (ttsState === "idle") startPlayback();
    else if (ttsState === "playing") { audioRef.current?.pause(); setTtsState("paused"); }
    else if (ttsState === "paused") { audioRef.current?.play(); setTtsState("playing"); }
    else if (ttsState === "loading") { abortRef.current = true; if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; } setTtsState("idle"); }
  }

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    };
  }, []);

  useEffect(() => {
    async function checkAccess() {
      const user = await getCurrentUser();
      if (!user) {
        setIsLoggedIn(false);
        setHasAccess(false);
        return;
      }
      setIsLoggedIn(true);

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

      if (data === true) {
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

      setHasAccess(data === true);
    }

    checkAccess();
  }, [bookId, searchParams]);

  // Loading state
  if (hasAccess === null) {
    return (
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.background }}>
        <header
          className="sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300"
          style={{
            backgroundColor: settings.themeMode === "dark" ? "rgba(26, 26, 26, 0.9)" : `${theme.background}ee`,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-2.5">
            <Link
              href={`/bible/${bookSlug}`}
              className="flex items-center gap-1.5 active:opacity-70 transition-opacity min-w-[60px]"
              style={{ color: "var(--accent)" }}
            >
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[13px] font-medium">{bookName}</span>
            </Link>
            <h1 className="text-[15px] font-semibold" style={{ color: theme.text, fontFamily: fontStack }}>
              Summary
            </h1>
            <span className="min-w-[60px]" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 text-center">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: theme.border, borderTopColor: "var(--accent)" }}
          />
        </main>
      </div>
    );
  }

  // Rate limited state
  if (rateLimited) {
    return (
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.background }}>
        <header
          className="sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300"
          style={{
            backgroundColor: settings.themeMode === "dark" ? "rgba(26, 26, 26, 0.9)" : `${theme.background}ee`,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-2.5">
            <Link
              href={`/bible/${bookSlug}`}
              className="flex items-center gap-1.5 active:opacity-70 transition-opacity min-w-[60px]"
              style={{ color: "var(--accent)" }}
            >
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[13px] font-medium">{bookName}</span>
            </Link>
            <h1 className="text-[15px] font-semibold" style={{ color: theme.text, fontFamily: fontStack }}>
              Summary
            </h1>
            <span className="min-w-[60px]" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 text-center">
          <p className="text-[15px]" style={{ color: theme.secondary }}>
            Daily summary view limit reached. Please try again tomorrow.
          </p>
        </main>
      </div>
    );
  }

  // Locked state
  if (!hasAccess) {
    return (
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.background }}>
        <header
          className="sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300"
          style={{
            backgroundColor: settings.themeMode === "dark" ? "rgba(26, 26, 26, 0.9)" : `${theme.background}ee`,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-2.5">
            <Link
              href={`/bible/${bookSlug}`}
              className="flex items-center gap-1.5 active:opacity-70 transition-opacity min-w-[60px]"
              style={{ color: "var(--accent)" }}
            >
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[13px] font-medium">{bookName}</span>
            </Link>
            <h1 className="text-[15px] font-semibold" style={{ color: theme.text, fontFamily: fontStack }}>
              Summary
            </h1>
            <span className="min-w-[60px]" />
          </div>
        </header>
        <SummaryPaywall
          bookName={bookName}
          bookId={bookId}
          bookSlug={bookSlug}
          isAuthenticated={isLoggedIn}
        />
      </div>
    );
  }

  // No summary available
  if (!summaryText) {
    return (
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.background }}>
        <header
          className="sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300"
          style={{
            backgroundColor: settings.themeMode === "dark" ? "rgba(26, 26, 26, 0.9)" : `${theme.background}ee`,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-2.5">
            <Link
              href={`/bible/${bookSlug}`}
              className="flex items-center gap-1.5 active:opacity-70 transition-opacity min-w-[60px]"
              style={{ color: "var(--accent)" }}
            >
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[13px] font-medium">{bookName}</span>
            </Link>
            <h1 className="text-[15px] font-semibold" style={{ color: theme.text, fontFamily: fontStack }}>
              Summary
            </h1>
            <span className="min-w-[60px]" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 text-center">
          <p className="text-[15px]" style={{ color: theme.secondary }}>
            Summary for {bookName} is not yet available.
          </p>
        </main>
      </div>
    );
  }

  // Full summary view
  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.background }}>
      {/* Persistent audio element for mobile-safe TTS playback */}
      <audio ref={audioRef} playsInline style={{ display: "none" }} preload="none" />
      <header
        className="sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300"
        style={{
          backgroundColor: settings.themeMode === "dark" ? "rgba(26, 26, 26, 0.9)" : `${theme.background}ee`,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-2.5">
          <Link
            href={`/bible/${bookSlug}`}
            className="flex items-center gap-1.5 active:opacity-70 transition-opacity min-w-[60px]"
            style={{ color: "var(--accent)" }}
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[13px] font-medium">{bookName}</span>
          </Link>
          <h1 className="text-[15px] font-semibold" style={{ color: theme.text, fontFamily: fontStack }}>
            Summary
          </h1>
          <div className="flex items-center gap-2 min-w-[60px] justify-end">
            {/* TTS play/pause */}
            <button
              onClick={handleTtsToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold active:opacity-70 transition-all"
              style={{
                backgroundColor: ttsState === "playing" || ttsState === "paused" ? "var(--accent)" : theme.card,
                color: ttsState === "playing" || ttsState === "paused" ? "white" : theme.text,
                border: ttsState === "playing" || ttsState === "paused" ? "none" : `1px solid ${theme.border}`,
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
            {/* Settings gear */}
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
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <div className="text-center pt-6 pb-10">
          <h1
            className="font-semibold tracking-tight leading-none"
            style={{
              color: theme.text,
              fontFamily: fontStack,
              fontSize: "clamp(2rem, 8vw, 3rem)",
            }}
          >
            {bookName}
          </h1>
          <p
            className="mt-3 tracking-[0.25em] uppercase font-semibold"
            style={{ color: theme.secondary, fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)" }}
          >
            Summary
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: theme.border }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.secondary, opacity: 0.4 }} />
            <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: theme.border }} />
          </div>
        </div>

        <div
          className="summary-text leading-relaxed transition-all duration-300"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            fontFamily: fontStack,
          }}
        >
          {renderMarkdown(summaryText, theme, fontStack)}
        </div>

        <nav className="mt-16 pt-6 border-t" style={{ borderColor: theme.border }}>
          <Link
            href={`/bible/${bookSlug}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Read {bookName}
          </Link>
          <Link
            href="/bible"
            className="flex items-center justify-center gap-2 w-full py-2.5 mt-3 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98]"
            style={{ color: "var(--accent)", border: `1px solid ${theme.border}` }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
            </svg>
            All Books
          </Link>
        </nav>

        <p className="text-center mt-8 text-[11px] tracking-wide" style={{ color: theme.secondary }}>
          BIBLESUMMARY.AI
        </p>
      </main>
    </div>
  );
}
