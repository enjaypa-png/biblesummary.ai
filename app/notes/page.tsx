"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { supabase, getCurrentUser } from "@/lib/supabase";

interface Note {
  id: string;
  book_id: string;
  chapter: number;
  verse: number;
  note_text: string;
  created_at: string;
  updated_at: string;
  book_name?: string;
  book_slug?: string;
  book_order?: number;
  verse_text?: string;
}

type SortMode = "time" | "bible";

export default function NotesPage() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("bible");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUserAndNotes();
  }, []);

  async function loadUserAndNotes() {
    setLoading(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("updated_at", { ascending: false });

      if (notesData && notesData.length > 0) {
        // Fetch book names and order for all notes
        const bookIds = Array.from(new Set(notesData.map((n: Note) => n.book_id)));
        const { data: books } = await supabase
          .from("books")
          .select("id, name, slug, order_index")
          .in("id", bookIds);

        const bookMap = new Map(books?.map((b: any) => [b.id, b]) || []);

        // Fetch verse texts for all notes
        const versePromises = notesData.map(async (n: Note) => {
          const { data: verseData } = await supabase
            .from("verses")
            .select("text")
            .eq("book_id", n.book_id)
            .eq("chapter", n.chapter)
            .eq("verse", n.verse)
            .single();
          return { noteId: n.id, verseText: verseData?.text || "" };
        });

        const verseTexts = await Promise.all(versePromises);
        const verseTextMap = new Map(verseTexts.map((v) => [v.noteId, v.verseText]));

        const enriched = notesData.map((n: Note) => {
          const book = bookMap.get(n.book_id) as any;
          return {
            ...n,
            book_name: book?.name || "Unknown",
            book_slug: book?.slug || "",
            book_order: book?.order_index || 999,
            verse_text: verseTextMap.get(n.id) || "",
          };
        });
        setNotes(enriched);
      }
    }
    setLoading(false);
  }

  async function deleteNote(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    setNotes(notes.filter((n) => n.id !== id));
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    await supabase.from("notes").update({ note_text: editText.trim() }).eq("id", id);
    setNotes(notes.map((n) => (n.id === id ? { ...n, note_text: editText.trim() } : n)));
    setEditingId(null);
    setEditText("");
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;

    const query = searchQuery.toLowerCase().trim();
    return notes.filter((note) => {
      // Search in note text
      if (note.note_text.toLowerCase().includes(query)) return true;
      // Search in book name
      if (note.book_name?.toLowerCase().includes(query)) return true;
      // Search in reference (e.g., "genesis 1:3" or "1:3")
      const reference = `${note.book_name} ${note.chapter}:${note.verse}`.toLowerCase();
      if (reference.includes(query)) return true;
      // Search in verse text
      if (note.verse_text?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [notes, searchQuery]);

  // Sort and group notes
  const sortedAndGroupedNotes = useMemo(() => {
    const notesToProcess = filteredNotes;

    if (sortMode === "time") {
      // Sort by time (most recent first), no grouping
      return {
        grouped: false,
        notes: [...notesToProcess].sort(
          (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
        ),
      };
    } else {
      // Sort by Bible order, group by book
      const sorted = [...notesToProcess].sort((a, b) => {
        // First by book order
        if ((a.book_order || 0) !== (b.book_order || 0)) {
          return (a.book_order || 0) - (b.book_order || 0);
        }
        // Then by chapter
        if (a.chapter !== b.chapter) {
          return a.chapter - b.chapter;
        }
        // Then by verse
        return a.verse - b.verse;
      });

      // Group by book
      const groups: { bookName: string; notes: Note[] }[] = [];
      let currentBook = "";
      let currentGroup: Note[] = [];

      sorted.forEach((note) => {
        if (note.book_name !== currentBook) {
          if (currentGroup.length > 0) {
            groups.push({ bookName: currentBook, notes: currentGroup });
          }
          currentBook = note.book_name || "Unknown";
          currentGroup = [note];
        } else {
          currentGroup.push(note);
        }
      });

      if (currentGroup.length > 0) {
        groups.push({ bookName: currentBook, notes: currentGroup });
      }

      return { grouped: true, groups };
    }
  }, [filteredNotes, sortMode]);

  function truncateText(text: string, maxLength: number) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "…";
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
        >
          <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
            Notes
          </h1>
        </header>
        <main className="max-w-lg mx-auto px-5 py-20 text-center">
          <div
            className="w-6 h-6 mx-auto border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
          />
        </main>
      </div>
    );
  }

  // Note card component — clicking body expands, only "Go to verse" navigates
  const NoteCard = ({ note }: { note: Note }) => {
    const isExpanded = expandedId === note.id;
    const isEditing = editingId === note.id;

    function handleCardClick() {
      if (isExpanded) {
        // Collapse and cancel any editing
        setExpandedId(null);
        setEditingId(null);
        setEditText("");
      } else {
        // Expand this note, collapse any other
        setExpandedId(note.id);
        setEditingId(null);
        setEditText("");
      }
    }

    function handleEditClick(e: React.MouseEvent) {
      e.stopPropagation();
      setEditingId(note.id);
      setEditText(note.note_text);
    }

    function handleCancelEdit(e: React.MouseEvent) {
      e.stopPropagation();
      setEditingId(null);
      setEditText("");
    }

    async function handleSave(e: React.MouseEvent) {
      e.stopPropagation();
      await saveEdit(note.id);
    }

    async function handleDelete(e: React.MouseEvent) {
      e.stopPropagation();
      await deleteNote(note.id);
      setExpandedId(null);
    }

    return (
      <div
        className="rounded-xl p-4 transition-all duration-200"
        style={{ backgroundColor: "var(--card)", border: `0.5px solid ${isExpanded ? "var(--accent)" : "var(--border)"}` }}
      >
        {/* Clickable body area */}
        <div
          onClick={handleCardClick}
          className="cursor-pointer active:opacity-80 transition-opacity"
        >
          {/* Reference and date */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[14px] font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {note.book_name} {note.chapter}:{note.verse}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "var(--secondary)" }}>
                {formatDate(note.updated_at || note.created_at)}
              </span>
              {/* Expand/collapse chevron */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--secondary)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Verse text excerpt */}
          {note.verse_text && (
            <p
              className="text-[13px] leading-relaxed mb-3 italic"
              style={{ color: "var(--secondary)" }}
            >
              &ldquo;{isExpanded ? note.verse_text : truncateText(note.verse_text, 120)}&rdquo;
            </p>
          )}

          {/* Note text — truncated when collapsed, full when expanded */}
          {!isEditing && (
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--foreground)" }}>
              {isExpanded ? note.note_text : truncateText(note.note_text, 100)}
            </p>
          )}
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="mt-3" style={{ minHeight: "20vh", maxHeight: "25vh", display: "flex", flexDirection: "column" }}>
            {/* Editing area */}
            {isEditing ? (
              <div className="flex-1 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 w-full rounded-lg p-3 text-[14px] leading-relaxed resize-none outline-none"
                  style={{
                    backgroundColor: "var(--background)",
                    color: "var(--foreground)",
                    border: "1px solid var(--accent)",
                    minHeight: "12vh",
                  }}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white active:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-lg text-[13px] font-medium active:opacity-80 transition-opacity"
                    style={{ color: "var(--secondary)", backgroundColor: "var(--background)" }}
                  >
                    Cancel
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 rounded-lg text-[13px] font-medium active:opacity-80 transition-opacity"
                    style={{ color: "#ef4444" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Edit button */}
                <button
                  onClick={handleEditClick}
                  className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium active:opacity-80 transition-opacity mb-2"
                  style={{ color: "var(--accent)", backgroundColor: "var(--background)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  Edit note
                </button>
                <div className="flex-1" />
              </div>
            )}

            {/* Go to verse — the ONLY navigation trigger */}
            <Link
              href={`/bible/${note.book_slug}/${note.chapter}?verse=${note.verse}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 mt-2 pt-3 border-t active:opacity-70 transition-opacity"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-[15px] font-semibold" style={{ color: "var(--accent)" }}>
                Go to verse
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Collapsed: Go to verse hint */}
        {!isExpanded && (
          <Link
            href={`/bible/${note.book_slug}/${note.chapter}?verse=${note.verse}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 mt-3 pt-2 border-t active:opacity-70 transition-opacity"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-[15px] font-medium" style={{ color: "var(--accent)" }}>
              Go to verse
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    );
  };

  // Signed in, show notes
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-[13px] font-medium" style={{ color: "var(--secondary)" }}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
            Notes
          </h1>
          {/* Sort toggle */}
          <button
            onClick={() => setSortMode(sortMode === "time" ? "bible" : "time")}
            className="text-[12px] font-medium px-2 py-1 rounded-md active:opacity-70 transition-opacity"
            style={{ color: "var(--accent)" }}
          >
            {sortMode === "time" ? "By Time" : "By Book"}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Search input */}
        {notes.length > 0 && (
          <div className="mb-4">
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--secondary)", flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="flex-1 bg-transparent text-[14px] outline-none"
                style={{ color: "var(--foreground)" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full active:opacity-70"
                  style={{ color: "var(--secondary)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-7 h-7"
                style={{ color: "var(--accent)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
            </div>
            <h2 className="text-[17px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              No notes yet
            </h2>
            <p className="text-[13px] leading-relaxed mb-6" style={{ color: "var(--secondary)" }}>
              Tap any verse while reading to add a note.
            </p>
            <Link
              href="/bible"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Start Reading
            </Link>
          </div>
        ) : filteredNotes.length === 0 && searchQuery ? (
          <div className="py-16 text-center">
            <div
              className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--secondary)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <h2 className="text-[17px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              No matches found
            </h2>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--secondary)" }}>
              Try a different search term.
            </p>
          </div>
        ) : sortedAndGroupedNotes.grouped ? (
          // Grouped by book (Bible order)
          <div className="space-y-6">
            {(sortedAndGroupedNotes as { grouped: true; groups: { bookName: string; notes: Note[] }[] }).groups.map(
              (group) => (
                <div key={group.bookName}>
                  {/* Book section divider */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                    <span
                      className="text-[12px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--secondary)" }}
                    >
                      {group.bookName}
                    </span>
                    <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                  </div>
                  {/* Notes in this book */}
                  <div className="space-y-3">
                    {group.notes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          // Flat list (time order)
          <div className="space-y-3">
            {(sortedAndGroupedNotes as { grouped: false; notes: Note[] }).notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
