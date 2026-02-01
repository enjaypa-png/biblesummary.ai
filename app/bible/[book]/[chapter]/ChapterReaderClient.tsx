"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";

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
  const [fontSize, setFontSize] = useState(18);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showTools, setShowTools] = useState(false);

  // Notes state
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);
  const firstVerse = verses.length > 0 ? verses[0].verse : 1;
  const lastVerse = verses.length > 0 ? verses[verses.length - 1].verse : 1;

  // Load user and existing notes for this chapter
  useEffect(() => {
    async function load() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser && bookId) {
        const { data } = await supabase
          .from("notes")
          .select("id, verse, note_text")
          .eq("user_id", currentUser.id)
          .eq("book_id", bookId)
          .eq("chapter", chapter);
        if (data) setNotes(data);
      }
    }
    load();
  }, [bookId, chapter]);

  function getVerseNote(verseNum: number): NoteData | undefined {
    return notes.find((n) => n.verse === verseNum);
  }

  function handleVerseTap(verseNum: number) {
    if (activeVerse === verseNum) {
      setActiveVerse(null);
      setNoteText("");
      return;
    }
    setActiveVerse(verseNum);
    const existing = getVerseNote(verseNum);
    setNoteText(existing?.note_text || "");
  }

  async function saveNote() {
    if (!user || !activeVerse || !noteText.trim()) return;
    setSaving(true);

    const existing = getVerseNote(activeVerse);
    if (existing) {
      // Update
      await supabase.from("notes").update({ note_text: noteText.trim() }).eq("id", existing.id);
      setNotes(notes.map((n) => n.id === existing.id ? { ...n, note_text: noteText.trim() } : n));
    } else {
      // Insert
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
    setNoteText("");
  }

  async function deleteNote(verseNum: number) {
    const existing = getVerseNote(verseNum);
    if (!existing) return;
    await supabase.from("notes").delete().eq("id", existing.id);
    setNotes(notes.filter((n) => n.id !== existing.id));
    setActiveVerse(null);
    setNoteText("");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Bible-style page header ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto px-5 py-2.5">
          <button
            onClick={() => setShowChapterPicker(!showChapterPicker)}
            title="Jump to a different chapter"
            className="flex items-baseline gap-2 active:opacity-70 transition-opacity"
          >
            <span
              className="text-[15px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--foreground)", fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {bookName}
            </span>
            <span className="text-[13px] font-medium" style={{ color: "var(--secondary)" }}>
              {chapter}:{firstVerse}–{lastVerse}
            </span>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className={`transition-transform ${showChapterPicker ? 'rotate-180' : ''}`}>
              <path d="M1 1L4 4L7 1" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTools(!showTools)}
              title="Reading tools"
              className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-black/5 dark:active:bg-white/5"
              aria-label="Reading tools"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
                <circle cx="8" cy="6" r="2" fill="var(--secondary)" />
                <circle cx="16" cy="12" r="2" fill="var(--secondary)" />
                <circle cx="10" cy="18" r="2" fill="var(--secondary)" />
              </svg>
            </button>
            <Link
              href={`/bible/${bookSlug}`}
              title={`Back to ${bookName} chapters`}
              className="text-[13px] font-medium"
              style={{ color: "var(--accent)" }}
            >
              All Ch.
            </Link>
          </div>
        </div>

        {showChapterPicker && (
          <div className="border-t px-4 py-3 max-w-2xl mx-auto" style={{ borderColor: "var(--border)" }}>
            <div className="grid grid-cols-7 gap-1.5">
              {chapters.map((ch) => (
                <Link
                  key={ch}
                  href={`/bible/${bookSlug}/${ch}`}
                  title={`${bookName} chapter ${ch}`}
                  onClick={() => setShowChapterPicker(false)}
                  className="aspect-square rounded-lg flex items-center justify-center text-[13px] font-medium transition-all active:scale-95"
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

      {/* ── Tools sidebar ── */}
      {showTools && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowTools(false)} />
          <div className="fixed top-0 right-0 z-50 h-full w-72 shadow-2xl overflow-y-auto" style={{ backgroundColor: "var(--card)" }}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>Reading Tools</h2>
                <button onClick={() => setShowTools(false)} className="w-8 h-8 flex items-center justify-center rounded-full" aria-label="Close tools">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M13 1L1 13" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Font size */}
              <div className="mb-6">
                <label className="text-[12px] uppercase tracking-widest font-semibold block mb-3" style={{ color: "var(--secondary)" }}>Text Size</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} title="Decrease text size" className="w-10 h-10 flex items-center justify-center rounded-lg active:scale-95" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
                    <svg width="16" height="2" viewBox="0 0 16 2" fill="none"><line x1="0" y1="1" x2="16" y2="1" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-[15px] font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>{fontSize}px</span>
                  </div>
                  <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} title="Increase text size" className="w-10 h-10 flex items-center justify-center rounded-lg active:scale-95" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="0" y1="8" x2="16" y2="8" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="0" x2="8" y2="16" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${((fontSize - 14) / 14) * 100}%`, backgroundColor: "var(--accent)" }} />
                </div>
              </div>

              {/* Navigate */}
              <div className="mb-6">
                <label className="text-[12px] uppercase tracking-widest font-semibold block mb-3" style={{ color: "var(--secondary)" }}>Navigate</label>
                <div className="space-y-2">
                  <Link href={`/bible/${bookSlug}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ border: "1px solid var(--border)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span className="text-[14px] font-medium" style={{ color: "var(--foreground)" }}>{bookName} — All Chapters</span>
                  </Link>
                  <Link href="/bible" className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ border: "1px solid var(--border)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
                    <span className="text-[14px] font-medium" style={{ color: "var(--foreground)" }}>All Books</span>
                  </Link>
                </div>
              </div>

              {/* Info */}
              <div>
                <label className="text-[12px] uppercase tracking-widest font-semibold block mb-3" style={{ color: "var(--secondary)" }}>About this chapter</label>
                <div className="px-3 py-2.5 rounded-lg" style={{ backgroundColor: "var(--background)" }}>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--secondary)" }}>
                    {bookName}, Chapter {chapter} of {totalChapters}<br />
                    Verses {firstVerse}–{lastVerse} ({verses.length} verses)<br />
                    King James Version
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Bible text ── */}
      <main className="max-w-2xl mx-auto px-5 py-6">
        {/* Large book heading */}
        <div className="text-center pt-6 pb-10">
          <h1
            className="font-semibold tracking-tight leading-none"
            style={{ color: "var(--foreground)", fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "clamp(2rem, 8vw, 3rem)" }}
          >
            {bookName}
          </h1>
          <p className="mt-3 tracking-[0.25em] uppercase font-semibold" style={{ color: "var(--secondary)", fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)" }}>
            Chapter {chapter}
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: "var(--border)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--secondary)", opacity: 0.4 }} />
            <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: "var(--border)" }} />
          </div>
        </div>

        <div className="bible-text leading-relaxed" style={{ fontSize: `${fontSize}px`, lineHeight: 1.9, color: "var(--foreground)" }}>
          {verses.map((verse: Verse) => {
            const hasNote = !!getVerseNote(verse.verse);
            const isActive = activeVerse === verse.verse;

            return (
              <span key={verse.id}>
                <span
                  className={`inline cursor-pointer transition-colors rounded-sm ${
                    isActive ? 'bg-[var(--highlight)]' : ''
                  }`}
                  onClick={() => handleVerseTap(verse.verse)}
                  title={hasNote ? "View or edit your note" : user ? "Tap to add a note" : "Sign in to add notes"}
                >
                  <sup className="verse-number">{verse.verse}</sup>
                  {verse.text}
                </span>
                {hasNote && !isActive && (
                  <span
                    className="inline-flex items-center gap-0.5 ml-1 cursor-pointer select-none align-super"
                    onClick={() => handleVerseTap(verse.verse)}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "var(--highlight)", color: "var(--accent)", fontSize: "10px" }}>
                      Note
                    </span>
                  </span>
                )}
                {" "}

                {/* Inline note editor */}
                {isActive && (
                  <span className="block my-3 rounded-xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                    <span className="block text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--secondary)", fontFamily: "'Inter', sans-serif" }}>
                      {bookName} {chapter}:{verse.verse}
                    </span>
                    {user ? (
                      <>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Write your note..."
                          className="block w-full rounded-lg p-3 text-[14px] leading-relaxed resize-none outline-none"
                          style={{
                            backgroundColor: "var(--background)",
                            color: "var(--foreground)",
                            border: "1px solid var(--border)",
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
                            onClick={() => { setActiveVerse(null); setNoteText(""); }}
                            className="px-3 py-1.5 rounded-lg text-[13px] font-medium"
                            style={{ color: "var(--secondary)" }}
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
                      </>
                    ) : (
                      <span className="block text-[13px] leading-relaxed" style={{ color: "var(--secondary)", fontFamily: "'Inter', sans-serif" }}>
                        <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Sign in</Link>
                        {" "}to add notes to verses.
                      </span>
                    )}
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Chapter navigation */}
        <nav className="mt-16 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between items-center">
            {prevChapter ? (
              <Link
                href={`/bible/${bookSlug}/${prevChapter}`}
                title={`Go to ${bookName} chapter ${prevChapter}`}
                className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl transition-all active:scale-[0.97]"
                style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
              >
                <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--secondary)" }}>Previous</span>
                <span className="text-[15px] font-semibold flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
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
        </nav>

        <p className="text-center mt-8 text-[11px] tracking-wide" style={{ color: "var(--secondary)" }}>KING JAMES VERSION</p>
      </main>
    </div>
  );
}
