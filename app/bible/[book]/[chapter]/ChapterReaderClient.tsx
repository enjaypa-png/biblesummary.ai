"use client";

import Link from "next/link";
import { useState } from "react";

interface Verse {
  id: string;
  verse: number;
  text: string;
}

interface Props {
  bookName: string;
  bookSlug: string;
  chapter: number;
  totalChapters: number;
  verses: Verse[];
  prevChapter: number | null;
  nextChapter: number | null;
}

export default function ChapterReaderClient({
  bookName,
  bookSlug,
  chapter,
  totalChapters,
  verses,
  prevChapter,
  nextChapter,
}: Props) {
  const [fontSize, setFontSize] = useState(18);
  const [showChapterPicker, setShowChapterPicker] = useState(false);

  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-3">
          <Link
            href={`/bible/${bookSlug}`}
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {bookName}
          </Link>

          {/* Tappable chapter title - opens chapter picker */}
          <button
            onClick={() => setShowChapterPicker(!showChapterPicker)}
            className="flex items-center gap-1.5 px-3 py-1 -my-1 rounded-full transition-colors active:bg-black/5 dark:active:bg-white/5"
          >
            <span className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
              Chapter {chapter}
            </span>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className={`transition-transform ${showChapterPicker ? 'rotate-180' : ''}`}>
              <path d="M1 1L4 4L7 1" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Font size controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              className="w-8 h-8 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5"
              aria-label="Decrease font size"
            >
              <span className="text-xs font-semibold" style={{ color: "var(--secondary)" }}>A</span>
            </button>
            <button
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              className="w-8 h-8 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5"
              aria-label="Increase font size"
            >
              <span className="text-lg font-semibold" style={{ color: "var(--secondary)" }}>A</span>
            </button>
          </div>
        </div>

        {/* Chapter picker dropdown */}
        {showChapterPicker && (
          <div className="border-t px-4 py-3 max-w-2xl mx-auto" style={{ borderColor: "var(--border)" }}>
            <div className="grid grid-cols-7 gap-1.5">
              {chapters.map((ch) => (
                <Link
                  key={ch}
                  href={`/bible/${bookSlug}/${ch}`}
                  onClick={() => setShowChapterPicker(false)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[13px] font-medium transition-all active:scale-95 ${
                    ch === chapter ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: ch === chapter ? 'var(--accent)' : 'var(--card)',
                    color: ch === chapter ? '#fff' : 'var(--foreground)',
                    border: ch === chapter ? 'none' : '0.5px solid var(--border)',
                  }}
                >
                  {ch}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Bible text */}
      <main className="max-w-2xl mx-auto px-5 py-6">
        <div
          className="bible-text leading-relaxed"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.9, color: "var(--foreground)" }}
        >
          {verses.map((verse: Verse) => (
            <span key={verse.id}>
              <sup className="verse-number" style={{ fontSize: `${Math.max(10, fontSize - 6)}px` }}>{verse.verse}</sup>
              {verse.text}{" "}
            </span>
          ))}
        </div>

        {/* Chapter navigation */}
        <nav className="flex justify-between items-center mt-16 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          {prevChapter ? (
            <Link
              href={`/bible/${bookSlug}/${prevChapter}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97]"
              style={{ color: "var(--foreground)", backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Chapter {prevChapter}
            </Link>
          ) : (
            <div />
          )}

          {nextChapter ? (
            <Link
              href={`/bible/${bookSlug}/${nextChapter}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97]"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Chapter {nextChapter}
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : (
            <Link
              href={`/bible/${bookSlug}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97]"
              style={{ backgroundColor: "var(--accent)" }}
            >
              All Chapters
            </Link>
          )}
        </nav>

        {/* Version label */}
        <p className="text-center mt-8 text-[11px] tracking-wide" style={{ color: "var(--secondary)" }}>
          KING JAMES VERSION
        </p>
      </main>
    </div>
  );
}
