"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
  const { settings, openPanel } = useReadingSettings();
  const theme = themeStyles[settings.themeMode];

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

  useEffect(() => {
    async function checkAccess() {
      const user = await getCurrentUser();
      if (!user) {
        setIsLoggedIn(false);
        setHasAccess(false);
        return;
      }
      setIsLoggedIn(true);

      const { data, error } = await supabase.rpc("user_has_summary_access", {
        p_user_id: user.id,
        p_book_id: bookId,
      });

      if (error) {
        setHasAccess(false);
        return;
      }

      setHasAccess(data === true);
    }

    checkAccess();
  }, [bookId]);

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
          <div className="flex items-center min-w-[60px] justify-end">
            <button
              onClick={openPanel}
              title="Reading settings"
              className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70 transition-opacity"
              aria-label="Reading settings"
              style={{ backgroundColor: theme.card }}
            >
              <span
                className="font-serif font-medium tracking-tight select-none"
                style={{ color: theme.secondary, fontSize: "14px", lineHeight: 1 }}
              >
                Aa
              </span>
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
