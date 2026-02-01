"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
}

export default function NotesPage() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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
        // Fetch book names for all notes
        const bookIds = Array.from(new Set(notesData.map((n: Note) => n.book_id)));
        const { data: books } = await supabase
          .from("books")
          .select("id, name, slug")
          .in("id", bookIds);

        const bookMap = new Map(books?.map((b: any) => [b.id, b]) || []);
        const enriched = notesData.map((n: Note) => {
          const book = bookMap.get(n.book_id) as any;
          return {
            ...n,
            book_name: book?.name || "Unknown",
            book_slug: book?.slug || "",
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

  // Not signed in
  if (!loading && !user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
          <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
            Notes
          </h1>
        </header>
        <main className="max-w-lg mx-auto px-5 py-20 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7" style={{ color: "var(--accent)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            Sign in to use Notes
          </h2>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: "var(--secondary)" }}>
            Create an account to save private notes on any verse.<br />
            Notes are never shared or analyzed.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login?redirect=%2Fnotes" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>
              Sign In
            </Link>
            <Link href="/signup?redirect=%2Fnotes" className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ color: "var(--foreground)", border: "1px solid var(--border)" }}>
              Create Account
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
          <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
            Notes
          </h1>
        </header>
        <main className="max-w-lg mx-auto px-5 py-20 text-center">
          <p className="text-[14px]" style={{ color: "var(--secondary)" }}>Loading your notes...</p>
        </main>
      </div>
    );
  }

  // Signed in, show notes
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-[13px] font-medium" style={{ color: "var(--secondary)" }}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
            Notes
          </h1>
          <span className="w-[50px]" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {notes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7" style={{ color: "var(--accent)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </div>
            <h2 className="text-[17px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              No notes yet
            </h2>
            <p className="text-[13px] leading-relaxed mb-6" style={{ color: "var(--secondary)" }}>
              Tap any verse while reading to add a note.
            </p>
            <Link href="/bible" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>
              Start Reading
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
              >
                {/* Verse reference */}
                <div className="flex items-center justify-between mb-2">
                  <Link
                    href={`/bible/${note.book_slug}/${note.chapter}`}
                    className="text-[13px] font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    {note.book_name} {note.chapter}:{note.verse}
                  </Link>
                  <span className="text-[11px]" style={{ color: "var(--secondary)" }}>
                    {formatDate(note.updated_at || note.created_at)}
                  </span>
                </div>

                {/* Note text or edit field */}
                {editingId === note.id ? (
                  <div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full rounded-lg p-3 text-[14px] leading-relaxed resize-none outline-none"
                      style={{
                        backgroundColor: "var(--background)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                      }}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => { setEditingId(null); setEditText(""); }}
                        className="px-3 py-1.5 rounded-lg text-[13px] font-medium"
                        style={{ color: "var(--secondary)" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(note.id)}
                        className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white"
                        style={{ backgroundColor: "var(--accent)" }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {note.note_text}
                  </p>
                )}

                {/* Actions */}
                {editingId !== note.id && (
                  <div className="flex gap-4 mt-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => { setEditingId(note.id); setEditText(note.note_text); }}
                      className="text-[12px] font-medium"
                      style={{ color: "var(--secondary)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-[12px] font-medium"
                      style={{ color: "#DC2626" }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
