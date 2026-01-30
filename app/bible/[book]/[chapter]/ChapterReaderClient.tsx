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
      {/* Slim toolbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-2">
          {/* Back to chapters */}
          <Link
            href={`/bible/${bookSlug}`}
            title={`Back to ${bookName} chapters`}
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Chapters
          </Link>

          {/* Chapter picker toggle */}
          <button
            onClick={() => setShowChapterPicker(!showChapterPicker)}
            title="Jump to a different chapter"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors active:bg-black/5 dark:active:bg-white/5"
          >
            <span className="text-[13px] font-medium" style={{ color: "var(--secondary)" }}>
              Ch. {chapter} of {totalChapters}
            </span>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className={`transition-transform ${showChapterPicker ? 'rotate-180' : ''}`}>
              <path d="M1 1L4 4L7 1" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Font size controls with labels */}
          <div className="flex items-center gap-1" title="Adjust text size">
            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              className="w-7 h-7 flex items-center justify-center rounded-md active:bg-black/5 dark:active:bg-white/5"
              title="Smaller text"
              aria-label="Smaller text"
              style={{ border: "0.5px solid var(--border)" }}
            >
              <span className="text-[10px] font-bold" style={{ color: "var(--secondary)" }}>A</span>
            </button>
            <button
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              className="w-7 h-7 flex items-center justify-center rounded-md active:bg-black/5 dark:active:bg-white/5"
              title="Larger text"
              aria-label="Larger text"
              style={{ border: "0.5px solid var(--border)" }}
            >
              <span className="text-[16px] font-bold" style={{ color: "var(--secondary)" }}>A</span>
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
                  title={`${bookName} chapter ${ch}`}
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
        {/* Large book + chapter heading */}
        <div className="text-center pt-4 pb-8">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "'Source Serif 4', Georgia, serif" }}>
            {bookName}
          </h1>
          <p className="text-sm mt-1.5 tracking-widest uppercase font-medium" style={{ color: "var(--secondary)" }}>
            Chapter {chapter}
          </p>
          <div className="mx-auto mt-4 w-16 h-px" style={{ backgroundColor: "var(--border)" }} />
        </div>

        <div
          className="bible-text leading-relaxed"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.9, color: "var(--foreground)" }}
        >
          {verses.map((verse: Verse) => (
            <span key={verse.id}>
              <sup className="verse-number">{verse.verse}</sup>
              {verse.text}{" "}
            </span>
          ))}
        </div>

        {/* Chapter navigation - clear left/right with labels */}
        <nav className="mt-16 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between items-center">
            {prevChapter ? (
              <Link
                href={`/bible/${bookSlug}/${prevChapter}`}
                title={`Go to ${bookName} chapter ${prevChapter}`}
                className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl transition-all active:scale-[0.97]"
                style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
              >
                <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--secondary)" }}>
                  Previous
                </span>
                <span className="text-[15px] font-semibold flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                    <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Chapter {prevChapter}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextChapter ? (
              <Link
                href={`/bible/${bookSlug}/${nextChapter}`}
                title={`Continue to ${bookName} chapter ${nextChapter}`}
                className="flex flex-col items-end gap-0.5 px-4 py-3 rounded-xl transition-all active:scale-[0.97]"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <span className="text-[11px] uppercase tracking-wider font-medium" style={{ opacity: 0.8 }}>
                  Next
                </span>
                <span className="text-[15px] font-semibold flex items-center gap-1.5">
                  Chapter {nextChapter}
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                    <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </Link>
            ) : (
              <Link
                href={`/bible/${bookSlug}`}
                title={`Back to ${bookName} chapter list`}
                className="flex flex-col items-end gap-0.5 px-4 py-3 rounded-xl transition-all active:scale-[0.97]"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <span className="text-[11px] uppercase tracking-wider font-medium" style={{ opacity: 0.8 }}>
                  Finished
                </span>
                <span className="text-[15px] font-semibold">
                  All Chapters
                </span>
              </Link>
            )}
          </div>
        </nav>

        {/* Version label */}
        <p className="text-center mt-8 text-[11px] tracking-wide" style={{ color: "var(--secondary)" }}>
          KING JAMES VERSION
        </p>
      </main>
    </div>
  );
}
