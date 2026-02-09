"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useReadingSettings, themeStyles } from "@/contexts/ReadingSettingsContext";
import { useExplanationCache, getVerseId } from "@/lib/verseStore";
import InlineAudioPlayer from "@/components/InlineAudioPlayer";
import VerseActionBar from "@/components/VerseActionBar";

interface Verse {
  id: string;
  verse: number;
  text: string;
}

interface NoteData {
  id: string;
  verse: number;
  note_text: string;
}

interface Props {
  bookName: string;
  bookSlug: string;
  bookId: string;
  chapter: number;
  totalChapters: number;
  verses: Verse[];
  prevChapter: number | null;
  nextChapter: number | null;
}

export default function ChapterReaderClient({
  bookName,
  bookSlug,
  bookId,
  chapter,
  totalChapters,
  verses,
  prevChapter,
  nextChapter,
}: Props) {
  const router = useRouter();
  const [showChapterPicker, setShowChapterPicker] = useState(false);

  // Verse scroll/highlight from Index navigation
  const searchParams = useSearchParams();
  const initialVerse = searchParams.get("verse");
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(
    initialVerse ? parseInt(initialVerse) : null
  );
  const verseRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  // Notes state
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  // Bookmark state
  const [bookmarkedVerse, setBookmarkedVerse] = useState<number | null>(null);

  // Inline Explain state
  const [explainStatus, setExplainStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [explanation, setExplanation] = useState<string | null>(null);
  const { addToCache, getFromCache } = useExplanationCache();

  // Reading settings
  const { settings, openPanel } = useReadingSettings();
  const theme = themeStyles[settings.themeMode];

  // Get font stack for current font family
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

  // Global audio player
  const {
    books,
    loadBooks,
    setSelection,
    currentlyPlayingVerse,
    currentTrackId,
  } = useAudioPlayer();

  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);
  const firstVerse = verses.length > 0 ? verses[0].verse : 1;
  const lastVerse = verses.length > 0 ? verses[verses.length - 1].verse : 1;

  // Current track for this page
  const thisTrackId = `${bookSlug}:${chapter}`;
  const isThisTrackActive = currentTrackId === thisTrackId;

  // Load books and set selection on mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Update selection when this page loads
  useEffect(() => {
    if (books.length > 0) {
      const book = books.find(b => b.slug === bookSlug);
      if (book) {
        setSelection(book, chapter);
      }
    }
  }, [books, bookSlug, chapter, setSelection]);

  // Save current reading position to localStorage (automatic reading progress)
  useEffect(() => {
    localStorage.setItem('lastViewedBook', bookSlug);
    localStorage.setItem('lastViewedChapter', chapter.toString());
    localStorage.setItem('lastReadPosition', JSON.stringify({
      bookSlug,
      bookName,
      chapter,
      verse: 1,
      timestamp: Date.now(),
    }));
  }, [bookSlug, bookName, chapter]);

  // Scroll to verse from Index navigation
  useEffect(() => {
    if (highlightedVerse) {
      // Small delay to ensure DOM is ready
      const scrollTimer = setTimeout(() => {
        const verseElement = verseRefs.current.get(highlightedVerse);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);

      // Clear highlight after 3 seconds
      const highlightTimer = setTimeout(() => {
        setHighlightedVerse(null);
      }, 3000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(highlightTimer);
      };
    }
  }, [highlightedVerse]);

  useEffect(() => {
    async function load() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser && bookId) {
        // Load notes for this chapter
        const { data } = await supabase
          .from("notes")
          .select("id, verse, note_text")
          .eq("user_id", currentUser.id)
          .eq("book_id", bookId)
          .eq("chapter", chapter);
        if (data) setNotes(data);

        // Load bookmark (check if it's on this chapter)
        const { data: bm } = await supabase
          .from("bookmarks")
          .select("verse, book_id, chapter")
          .eq("user_id", currentUser.id)
          .single();
        if (bm && bm.book_id === bookId && bm.chapter === chapter) {
          setBookmarkedVerse(bm.verse);
        } else {
          setBookmarkedVerse(null);
        }
      }
    }
    load();
  }, [bookId, chapter]);

  function getVerseNote(verseNum: number): NoteData | undefined {
    return notes.find((n) => n.verse === verseNum);
  }

  function handleVerseTap(verseNum: number, verseText: string) {
    // Update automatic reading position
    localStorage.setItem('lastReadPosition', JSON.stringify({
      bookSlug,
      bookName,
      chapter,
      verse: verseNum,
      timestamp: Date.now(),
    }));

    if (activeVerse === verseNum) {
      // If tapping the same verse, close everything
      setActiveVerse(null);
      setShowToolbar(false);
      setShowNoteEditor(false);
      setNoteText("");
      setExplainStatus("idle");
      setExplanation(null);
      return;
    }
    // Show plus button for this verse
    setActiveVerse(verseNum);
    setShowToolbar(false);
    setShowNoteEditor(false);
    const existing = getVerseNote(verseNum);
    setNoteText(existing?.note_text || "");

    // Reset explanation state for new verse (check cache)
    const verseId = getVerseId(bookName, chapter, verseNum);
    const cached = getFromCache(verseId);
    if (cached) {
      setExplanation(cached.text);
      setExplainStatus("success");
    } else {
      setExplainStatus("idle");
      setExplanation(null);
    }
  }

  function handleOpenNoteEditor() {
    setShowNoteEditor(true);
  }

  function handleCloseActions() {
    setActiveVerse(null);
    setShowToolbar(false);
    setShowNoteEditor(false);
    setNoteText("");
    setExplainStatus("idle");
    setExplanation(null);
  }

  function handleBookSummary() {
    handleCloseActions();
    router.push(`/summaries/${bookSlug}`);
  }

  async function handleShare(verseNum: number, verseText: string) {
    const shareText = `"${verseText}" — ${bookName} ${chapter}:${verseNum} (KJV)\nBibleSummary.ai`;

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
        });
      } catch (err) {
        // User cancelled or share failed - fall back to clipboard
        if ((err as Error).name !== "AbortError") {
          await copyToClipboard(shareText);
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      await copyToClipboard(shareText);
    }
    handleCloseActions();
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  async function handleExplain(verseNum: number) {
    const verseId = getVerseId(bookName, chapter, verseNum);

    // Check local cache first
    const cached = getFromCache(verseId);
    if (cached) {
      setExplanation(cached.text);
      setExplainStatus("success");
      return;
    }

    setExplainStatus("loading");

    try {
      const response = await fetch("/api/explain-verse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verse_id: verseId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch explanation");
      }

      const data = await response.json();

      if (data.explanation) {
        setExplanation(data.explanation);
        setExplainStatus("success");
        addToCache(verseId, data.explanation);
      } else {
        throw new Error("No explanation received");
      }
    } catch (error) {
      console.error("Explain error:", error);
      setExplainStatus("error");
    }
  }

  async function saveNote() {
    if (!user || !activeVerse || !noteText.trim()) return;
    setSaving(true);
    const existing = getVerseNote(activeVerse);
    if (existing) {
      await supabase.from("notes").update({ note_text: noteText.trim() }).eq("id", existing.id);
      setNotes(notes.map((n) => n.id === existing.id ? { ...n, note_text: noteText.trim() } : n));
    } else {
      const { data } = await supabase.from("notes").insert({
        user_id: user.id,
        book_id: bookId,
        chapter,
        verse: activeVerse,
        note_text: noteText.trim(),
      }).select("id, verse, note_text").single();
      if (data) setNotes([...notes, data]);
    }
    setSaving(false);
    setActiveVerse(null);
    setShowNoteEditor(false);
    setNoteText("");
  }

  async function deleteNote(verseNum: number) {
    const existing = getVerseNote(verseNum);
    if (!existing) return;
    await supabase.from("notes").delete().eq("id", existing.id);
    setNotes(notes.filter((n) => n.id !== existing.id));
    setActiveVerse(null);
    setShowNoteEditor(false);
    setNoteText("");
  }

  async function handleBookmark(verseNum: number) {
    if (!user) return;

    // Toggle: if this verse is already bookmarked, remove the bookmark
    if (bookmarkedVerse === verseNum) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id);
      setBookmarkedVerse(null);
      handleCloseActions();
      return;
    }

    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase.from("bookmarks").update({
        book_id: bookId,
        book_slug: bookSlug,
        book_name: bookName,
        chapter,
        verse: verseNum,
      }).eq("id", existing.id);
    } else {
      await supabase.from("bookmarks").insert({
        user_id: user.id,
        book_id: bookId,
        book_slug: bookSlug,
        book_name: bookName,
        chapter,
        verse: verseNum,
      });
    }
    setBookmarkedVerse(verseNum);
    handleCloseActions();
  }

  // Highlight color based on theme
  const highlightBg = settings.themeMode === "dark"
    ? "rgba(37, 99, 235, 0.2)"
    : "rgba(37, 99, 235, 0.08)";

  const highlightBorder = settings.themeMode === "dark"
    ? "rgba(37, 99, 235, 0.5)"
    : "rgba(37, 99, 235, 0.4)";

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.background }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300"
        style={{
          backgroundColor: settings.themeMode === "dark" ? "rgba(26, 26, 26, 0.9)" : `${theme.background}ee`,
          borderBottom: `1px solid ${theme.border}`
        }}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-2.5">
          {/* Left: Back to all books */}
          <Link
            href="/bible"
            title="All books"
            className="flex items-center gap-1.5 active:opacity-70 transition-opacity min-w-[60px]"
            style={{ color: "var(--accent)" }}
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[13px] font-medium">Books</span>
          </Link>

          {/* Center: Book name + chapter picker toggle */}
          <button
            onClick={() => setShowChapterPicker(!showChapterPicker)}
            title="Jump to a different chapter"
            className="flex items-center gap-1.5 active:opacity-70 transition-opacity"
          >
            <span
              className="text-[15px] font-semibold"
              style={{ color: theme.text, fontFamily: fontStack }}
            >
              {bookName} {chapter}
            </span>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className={`transition-transform ${showChapterPicker ? 'rotate-180' : ''}`}>
              <path d="M1 1L4 4L7 1" stroke={theme.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Right: Typography settings icon */}
          <div className="flex items-center gap-2 min-w-[60px] justify-end">
            <button
              onClick={openPanel}
              title="Reading settings"
              className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70 transition-opacity"
              aria-label="Reading settings"
              style={{ backgroundColor: theme.card }}
            >
              <span
                className="font-serif font-medium tracking-tight select-none"
                style={{
                  color: theme.secondary,
                  fontSize: "14px",
                  lineHeight: 1,
                }}
              >
                Aa
              </span>
            </button>
          </div>
        </div>

        {/* Chapter picker dropdown */}
        {showChapterPicker && (
          <div className="border-t px-4 py-3 max-w-2xl mx-auto" style={{ borderColor: theme.border }}>
            <Link
              href="/bible"
              onClick={() => setShowChapterPicker(false)}
              className="flex items-center justify-center gap-2 mb-3 py-2 rounded-lg text-[13px] font-semibold"
              style={{ backgroundColor: theme.card, color: "var(--accent)", border: `1px solid ${theme.border}` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
              </svg>
              Change Book
            </Link>
            <div className="grid grid-cols-7 gap-1.5">
              {chapters.map((ch) => (
                <Link
                  key={ch}
                  href={`/bible/${bookSlug}/${ch}`}
                  title={`${bookName} chapter ${ch}`}
                  onClick={() => setShowChapterPicker(false)}
                  className="aspect-square rounded-lg flex items-center justify-center text-[13px] font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: ch === chapter ? 'var(--accent)' : theme.card,
                    color: ch === chapter ? '#fff' : theme.text,
                    border: ch === chapter ? 'none' : `0.5px solid ${theme.border}`,
                  }}
                >
                  {ch}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Bible text ── */}
      <main className="max-w-2xl mx-auto px-5 py-6">
        <div className="text-center pt-6 pb-10">
          <h1
            className="font-semibold tracking-tight leading-none"
            style={{
              color: theme.text,
              fontFamily: fontStack,
              fontSize: "clamp(2rem, 8vw, 3rem)"
            }}
          >
            {bookName}
          </h1>
          <p className="mt-3 tracking-[0.25em] uppercase font-semibold" style={{ color: theme.secondary, fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)" }}>
            Chapter {chapter}
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: theme.border }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.secondary, opacity: 0.4 }} />
            <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: theme.border }} />
          </div>
        </div>

        {/* Inline Audio Player */}
        <div className="mb-8">
          <InlineAudioPlayer
            bookSlug={bookSlug}
            chapter={chapter}
            totalVerses={verses.length}
          />
        </div>

        <div
          className="bible-text leading-relaxed transition-all duration-300"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            color: theme.text,
            fontFamily: fontStack,
          }}
        >
          {verses.map((verse: Verse) => {
            const hasNote = !!getVerseNote(verse.verse);
            const isActive = activeVerse === verse.verse;
            const isCurrentVerse = isThisTrackActive && currentlyPlayingVerse === verse.verse;
            const isHighlighted = highlightedVerse === verse.verse;

            // Determine background color with priority: active > highlighted > currentVerse
            let bgColor = 'transparent';
            if (isActive) {
              bgColor = highlightBg;
            } else if (isHighlighted) {
              bgColor = "rgba(37, 99, 235, 0.12)";
            } else if (isCurrentVerse) {
              bgColor = highlightBg;
            }

            return (
              <span key={verse.id}>
                <span
                  ref={(el) => {
                    if (el) verseRefs.current.set(verse.verse, el);
                  }}
                  data-verse={verse.verse}
                  className={`inline cursor-pointer rounded-sm transition-all duration-500`}
                  style={{
                    backgroundColor: bgColor,
                    borderLeft: (isCurrentVerse || isHighlighted) && !isActive ? `2px solid ${highlightBorder}` : 'none',
                    paddingLeft: (isCurrentVerse || isHighlighted) && !isActive ? '4px' : '0',
                    marginLeft: (isCurrentVerse || isHighlighted) && !isActive ? '-6px' : '0',
                  }}
                  onClick={() => handleVerseTap(verse.verse, verse.text)}
                  title={hasNote ? "View or edit your note" : "Tap to add a note"}
                >
                  <sup className="verse-number">{verse.verse}</sup>
                  {verse.text}
                </span>
                {/* Note indicator */}
                {hasNote && !isActive && (
                  <span
                    className="inline-flex items-center gap-1.5 ml-2 cursor-pointer rounded-full px-4 py-1.5 align-middle active:opacity-70 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerseTap(verse.verse, verse.text);
                      handleOpenNoteEditor();
                    }}
                    style={{
                      backgroundColor: "var(--accent)",
                      fontFamily: "'Inter', sans-serif",
                      verticalAlign: "middle",
                    }}
                    title="Open note"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span className="text-[14px] font-bold text-white leading-none">Note</span>
                  </span>
                )}
                {" "}

                {/* Bookmark indicator */}
                {bookmarkedVerse === verse.verse && !isActive && (
                  <span
                    className="inline-flex items-center gap-1.5 ml-2 cursor-pointer rounded-full px-3.5 py-1.5 align-middle active:opacity-70 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerseTap(verse.verse, verse.text);
                    }}
                    style={{
                      backgroundColor: "var(--accent)",
                      fontFamily: "'Inter', sans-serif",
                      verticalAlign: "middle",
                    }}
                    title="Your bookmark"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-[14px] font-bold text-white leading-none">Saved</span>
                  </span>
                )}
                {" "}

                {/* Unified action bar */}
                {isActive && !showNoteEditor && explainStatus === "idle" && (
                  <VerseActionBar
                    onExplain={() => handleExplain(verse.verse)}
                    onNote={handleOpenNoteEditor}
                    onShare={() => handleShare(verse.verse, verse.text)}
                    onBookmark={user ? () => handleBookmark(verse.verse) : undefined}
                    isBookmarked={bookmarkedVerse === verse.verse}
                    onBookSummary={handleBookSummary}
                    onClose={handleCloseActions}
                  />
                )}

                {/* Inline explanation - loading */}
                {isActive && !showNoteEditor && explainStatus === "loading" && (
                  <span
                    className="block my-3 rounded-xl p-4"
                    style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, fontFamily: "'Inter', sans-serif" }}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 border-2 rounded-full animate-spin"
                        style={{
                          borderColor: theme.border,
                          borderTopColor: "var(--accent)",
                        }}
                      />
                      <span className="text-[14px]" style={{ color: theme.secondary }}>
                        Generating explanation...
                      </span>
                    </span>
                  </span>
                )}

                {/* Inline explanation - success */}
                {isActive && !showNoteEditor && explainStatus === "success" && explanation && (
                  <span
                    className="block my-3 rounded-xl p-4"
                    style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, fontFamily: "'Inter', sans-serif" }}
                  >
                    <span className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: "var(--accent)" }}>
                        Explanation
                      </span>
                      <button
                        onClick={handleCloseActions}
                        className="text-[12px] font-medium"
                        style={{ color: theme.secondary }}
                      >
                        Close
                      </button>
                    </span>
                    <span className="block text-[14px] leading-relaxed" style={{ color: theme.text }}>
                      {explanation}
                    </span>
                  </span>
                )}

                {/* Inline explanation - error */}
                {isActive && !showNoteEditor && explainStatus === "error" && (
                  <span
                    className="block my-3 rounded-xl p-4"
                    style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, fontFamily: "'Inter', sans-serif" }}
                  >
                    <span className="text-[14px] mb-3 block" style={{ color: theme.text }}>
                      Explanation unavailable.
                    </span>
                    <button
                      onClick={() => handleExplain(verse.verse)}
                      className="text-[13px] font-medium"
                      style={{ color: "var(--accent)" }}
                    >
                      Try again
                    </button>
                  </span>
                )}

                {isActive && showNoteEditor && (
                  <span className="block my-3 rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                    <span className="block text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: theme.secondary, fontFamily: "'Inter', sans-serif" }}>
                      {bookName} {chapter}:{verse.verse}
                    </span>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write your note..."
                      className="block w-full rounded-lg p-3 text-[14px] leading-relaxed resize-none outline-none"
                      style={{
                        backgroundColor: theme.background,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                        fontFamily: "'Inter', sans-serif",
                      }}
                      rows={3}
                      autoFocus
                    />
                    <span className="flex gap-2 mt-3 justify-end" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {hasNote && (
                        <button
                          onClick={() => deleteNote(verse.verse)}
                          className="px-3 py-1.5 rounded-lg text-[13px] font-medium"
                          style={{ color: "#DC2626" }}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={handleCloseActions}
                        className="px-3 py-1.5 rounded-lg text-[13px] font-medium"
                        style={{ color: theme.secondary }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveNote}
                        disabled={saving || !noteText.trim()}
                        className="px-4 py-1.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: "var(--accent)" }}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </span>
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Chapter navigation */}
        <nav className="mt-16 pt-6 border-t" style={{ borderColor: theme.border }}>
          <div className="flex justify-between items-center">
            {prevChapter ? (
              <Link
                href={`/bible/${bookSlug}/${prevChapter}`}
                title={`Go to ${bookName} chapter ${prevChapter}`}
                className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl transition-all active:scale-[0.97]"
                style={{ backgroundColor: theme.card, border: `0.5px solid ${theme.border}` }}
              >
                <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: theme.secondary }}>Previous</span>
                <span className="text-[15px] font-semibold flex items-center gap-1.5" style={{ color: theme.text }}>
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Chapter {prevChapter}
                </span>
              </Link>
            ) : <div />}

            {nextChapter ? (
              <Link
                href={`/bible/${bookSlug}/${nextChapter}`}
                title={`Continue to ${bookName} chapter ${nextChapter}`}
                className="flex flex-col items-end gap-0.5 px-4 py-3 rounded-xl transition-all active:scale-[0.97]"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <span className="text-[11px] uppercase tracking-wider font-medium" style={{ opacity: 0.8 }}>Next</span>
                <span className="text-[15px] font-semibold flex items-center gap-1.5">
                  Chapter {nextChapter}
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </Link>
            ) : (
              <Link
                href={`/bible/${bookSlug}`}
                title={`Back to ${bookName} chapter list`}
                className="flex flex-col items-end gap-0.5 px-4 py-3 rounded-xl transition-all active:scale-[0.97]"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <span className="text-[11px] uppercase tracking-wider font-medium" style={{ opacity: 0.8 }}>Finished</span>
                <span className="text-[15px] font-semibold">All Chapters</span>
              </Link>
            )}
          </div>

          {/* Always-visible way to get to another book */}
          <div className="mt-4">
            <Link
              href="/bible"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98]"
              style={{ color: "var(--accent)", border: `1px solid ${theme.border}` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
              </svg>
              All Books
            </Link>
          </div>
        </nav>

        <p className="text-center mt-8 text-[11px] tracking-wide" style={{ color: theme.secondary }}>KING JAMES VERSION</p>
      </main>
    </div>
  );
}
