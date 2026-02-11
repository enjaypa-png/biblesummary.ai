"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabase";

interface Book {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  testament: string;
  total_chapters: number;
}

type IndexTab = "books" | "chapters" | "verses";

export default function BibleIndex({ books }: { books: Book[] }) {
  const router = useRouter();

  // Navigation state
  const [activeTab, setActiveTab] = useState<IndexTab>("books");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verseCount, setVerseCount] = useState<number>(0);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Automatic reading position from localStorage
  const [readingPosition, setReadingPosition] = useState<{
    bookSlug: string;
    bookName: string;
    chapter: number;
    verse: number;
  } | null>(null);

  // Manual bookmark from Supabase
  const [bookmark, setBookmark] = useState<{
    book_name: string;
    book_slug: string;
    chapter: number;
    verse: number;
  } | null>(null);

  useEffect(() => {
    // Load automatic reading position from localStorage
    try {
      const saved = localStorage.getItem("lastReadPosition");
      if (saved) {
        const pos = JSON.parse(saved);
        if (pos.bookSlug && pos.chapter) {
          setReadingPosition(pos);
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Load manual bookmark from Supabase
    async function loadBookmark() {
      const user = await getCurrentUser();
      if (user) {
        const { data } = await supabase
          .from("bookmarks")
          .select("book_name, book_slug, chapter, verse")
          .eq("user_id", user.id)
          .single();
        if (data) setBookmark(data);
      }
    }
    loadBookmark();
  }, []);

  // Testament filter for books tab
  const [testament, setTestament] = useState<"Old" | "New">("Old");

  const oldTestament = books.filter((b) => b.testament === "Old");
  const newTestament = books.filter((b) => b.testament === "New");
  const allBooks = testament === "Old" ? oldTestament : newTestament;

  // Parse search query for verse reference navigation (e.g., "Genesis 1:3", "Gen 1", "1 John 3:16")
  const parsedReference = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;

    // Match patterns like "Genesis 1:3", "Gen 1", "1 John 3:16", "Song of Solomon 2:1"
    // The book name can start with a number (1 Kings, 2 Chronicles) and contain spaces
    // We look for a trailing number pattern: chapter or chapter:verse
    const match = q.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
    if (!match) return null;

    const bookQuery = match[1].toLowerCase().trim();
    const chapter = parseInt(match[2], 10);
    const verse = match[3] ? parseInt(match[3], 10) : null;

    // Find matching book across ALL books (not just current testament)
    const matchedBook = books.find((b) => {
      const name = b.name.toLowerCase();
      // Exact match
      if (name === bookQuery) return true;
      // Starts-with match (e.g., "gen" matches "genesis")
      if (name.startsWith(bookQuery)) return true;
      return false;
    });

    if (!matchedBook) return null;
    if (chapter < 1 || chapter > matchedBook.total_chapters) return null;

    return { book: matchedBook, chapter, verse };
  }, [searchQuery, books]);

  // Filter books by search
  const displayedBooks = useMemo(() => {
    if (!searchQuery.trim()) return allBooks;
    const q = searchQuery.toLowerCase().trim();
    // If we have a parsed reference, also strip the chapter:verse part to filter books
    return allBooks.filter((b) => b.name.toLowerCase().includes(q) || b.name.toLowerCase().startsWith(q.split(/\s+\d/)[0]));
  }, [allBooks, searchQuery]);

  // Generate chapter numbers for selected book
  const chapters = selectedBook
    ? Array.from({ length: selectedBook.total_chapters }, (_, i) => i + 1)
    : [];

  // Generate verse numbers
  const verses = Array.from({ length: verseCount }, (_, i) => i + 1);

  // Fetch verse count when chapter is selected
  useEffect(() => {
    async function fetchVerseCount() {
      if (!selectedBook || !selectedChapter) return;

      setLoadingVerses(true);
      try {
        const { count, error } = await supabase
          .from("verses")
          .select("*", { count: "exact", head: true })
          .eq("book_id", selectedBook.id)
          .eq("chapter", selectedChapter);

        if (!error && count !== null) {
          setVerseCount(count);
        }
      } catch (e) {
        console.error("Failed to fetch verse count:", e);
      } finally {
        setLoadingVerses(false);
      }
    }

    fetchVerseCount();
  }, [selectedBook, selectedChapter]);

  // Handle book selection
  function handleBookSelect(book: Book) {
    setSelectedBook(book);
    setSelectedChapter(null);
    setVerseCount(0);
    setActiveTab("chapters");
    setSearchQuery("");
  }

  // Handle chapter selection
  function handleChapterSelect(chapter: number) {
    setSelectedChapter(chapter);
    setActiveTab("verses");
  }

  // Handle verse selection - navigate to scripture
  function handleVerseSelect(verse: number) {
    if (!selectedBook || !selectedChapter) return;
    router.push(`/bible/${selectedBook.slug}/${selectedChapter}?verse=${verse}`);
  }

  // Handle navigating to a parsed reference from search
  function handleGoToReference() {
    if (!parsedReference) return;
    const { book, chapter, verse } = parsedReference;
    const url = verse
      ? `/bible/${book.slug}/${chapter}?verse=${verse}`
      : `/bible/${book.slug}/${chapter}`;
    setSearchQuery("");
    router.push(url);
  }

  // Handle back navigation
  function handleBack() {
    if (activeTab === "verses") {
      setActiveTab("chapters");
      setSelectedChapter(null);
      setVerseCount(0);
    } else if (activeTab === "chapters") {
      setActiveTab("books");
      setSelectedBook(null);
    }
  }

  // Handle tab clicks — navigate to the tab, resetting deeper state if needed
  function handleTabClick(tab: IndexTab) {
    if (tab === "books") {
      setActiveTab("books");
      setSelectedBook(null);
      setSelectedChapter(null);
      setVerseCount(0);
    } else if (tab === "chapters") {
      if (selectedBook) {
        setActiveTab("chapters");
        setSelectedChapter(null);
        setVerseCount(0);
      }
    } else if (tab === "verses") {
      if (selectedBook && selectedChapter) {
        setActiveTab("verses");
      }
    }
  }

  // Get context string for header
  function getContextString() {
    if (activeTab === "verses" && selectedBook && selectedChapter) {
      return `${selectedBook.name} ${selectedChapter}`;
    }
    if (activeTab === "chapters" && selectedBook) {
      return selectedBook.name;
    }
    return null;
  }

  const contextString = getContextString();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
      >
        <div className="max-w-lg mx-auto px-5 pt-5 pb-3">
          {/* Back button when not on books tab */}
          {activeTab !== "books" && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 mb-3 text-[14px] font-medium active:opacity-70 transition-opacity"
              style={{ color: "var(--accent)" }}
            >
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
          )}

          {/* Title */}
          <div className="text-center">
            <h1
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontSize: "24px",
                lineHeight: 1.2,
              }}
            >
              King James Version
            </h1>
            <h2
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontSize: "24px",
                lineHeight: 1.2,
              }}
            >
              Holy Bible
            </h2>
            <p
              className="mt-1.5 text-[13px] uppercase tracking-[0.2em] font-medium"
              style={{ color: "var(--foreground-secondary)" }}
            >
              Index
            </p>
          </div>

          {/* Context string (selected book/chapter) */}
          {contextString && (
            <p
              className="text-center mt-3 text-[16px] font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {contextString}
            </p>
          )}

          {/* Tab navigation — NEVER grayed out */}
          <div className="flex mt-4 gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--card)" }}>
            {(["books", "chapters", "verses"] as const).map((tab) => {
              const isActive = activeTab === tab;
              // Tabs are always tappable. If you haven't selected a book yet,
              // tapping "chapters" or "verses" simply does nothing.
              const hasSelection =
                tab === "books" ||
                (tab === "chapters" && selectedBook !== null) ||
                (tab === "verses" && selectedBook !== null && selectedChapter !== null);

              return (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className="flex-1 py-2 text-[14px] font-semibold rounded-lg transition-all capitalize"
                  style={{
                    backgroundColor: isActive ? "var(--background)" : "transparent",
                    color: isActive
                      ? "var(--foreground)"
                      : hasSelection
                        ? "var(--foreground-secondary)"
                        : "var(--foreground-secondary)",
                    boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    cursor: "pointer",
                    opacity: 1,
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-4 pb-8">
        {/* Continue Reading card (automatic reading position) */}
        {activeTab === "books" && readingPosition && (
          <Link
            href={`/bible/${readingPosition.bookSlug}/${readingPosition.chapter}?verse=${readingPosition.verse}`}
            className="flex items-center gap-3.5 mb-3 p-4 rounded-xl active:opacity-80 transition-opacity"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="block text-[11px] uppercase tracking-wider font-medium text-white/70">
                Continue Reading
              </span>
              <span className="block text-[16px] font-semibold text-white truncate">
                {readingPosition.bookName} {readingPosition.chapter}:{readingPosition.verse}
              </span>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="flex-shrink-0">
              <path d="M1 1L6 6L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}

        {/* Manual bookmark card (intentional marker) */}
        {activeTab === "books" && bookmark && (
          <Link
            href={`/bible/${bookmark.book_slug}/${bookmark.chapter}?verse=${bookmark.verse}`}
            className="flex items-center gap-3.5 mb-5 p-4 rounded-xl active:opacity-80 transition-opacity"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--accent)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="block text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--secondary)" }}>
                Your Bookmark
              </span>
              <span className="block text-[16px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                {bookmark.book_name} {bookmark.chapter}:{bookmark.verse}
              </span>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="flex-shrink-0">
              <path d="M1 1L6 6L1 11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}

        {/* Books Tab */}
        {activeTab === "books" && (
          <>
            {/* Search */}
            <div className="mb-4">
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--secondary)", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && parsedReference) {
                      handleGoToReference();
                    }
                  }}
                  placeholder="Search books or type a reference..."
                  className="flex-1 bg-transparent text-[15px] outline-none"
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

            {/* Go to reference card */}
            {parsedReference && (
              <button
                onClick={handleGoToReference}
                className="w-full flex items-center gap-3.5 mb-4 p-4 rounded-xl active:opacity-80 transition-opacity"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <div className="flex-1 min-w-0 text-left">
                  <span className="block text-[11px] uppercase tracking-wider font-medium text-white/70">
                    Go to
                  </span>
                  <span className="block text-[16px] font-semibold text-white truncate">
                    {parsedReference.book.name} {parsedReference.chapter}
                    {parsedReference.verse ? `:${parsedReference.verse}` : ""}
                  </span>
                </div>
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="flex-shrink-0">
                  <path d="M1 1L6 6L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {/* Testament toggle */}
            <div className="flex gap-0 mb-4">
              {(["Old", "New"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTestament(t); setSearchQuery(""); }}
                  className="flex-1 pb-2.5 text-[15px] font-semibold tracking-wide relative transition-colors"
                  style={{
                    color: testament === t ? "var(--foreground)" : "var(--foreground-secondary)",
                  }}
                >
                  {t} Testament
                  {testament === t && (
                    <span
                      className="absolute bottom-0 left-[15%] right-[15%] h-[2.5px] rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Book list */}
            {displayedBooks.length === 0 && searchQuery ? (
              <div className="py-12 text-center">
                <p className="text-[15px]" style={{ color: "var(--secondary)" }}>
                  No books match &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              <div>
                {displayedBooks.map((book, i) => (
                  <button
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className="w-full flex items-center justify-between px-3 py-[13px] text-left active:opacity-70 transition-opacity"
                    style={{
                      borderBottom: i < displayedBooks.length - 1 ? "0.5px solid var(--border)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className="text-[12px] font-medium w-5 text-right tabular-nums"
                        style={{ color: "var(--secondary)" }}
                      >
                        {book.order_index}
                      </span>
                      <span
                        className="truncate font-semibold"
                        style={{
                          color: "var(--foreground)",
                          fontSize: "17px",
                        }}
                      >
                        {book.name}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 flex-shrink-0 ml-2 px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: "var(--card)",
                        border: "0.5px solid var(--border)",
                      }}
                    >
                      <span className="text-[13px] font-medium tabular-nums" style={{ color: "var(--secondary)" }}>
                        {book.total_chapters} ch
                      </span>
                      <svg width="5" height="9" viewBox="0 0 6 10" fill="none">
                        <path d="M1 1L5 5L1 9" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Chapters Tab */}
        {activeTab === "chapters" && selectedBook && (
          <div className="grid grid-cols-5 gap-2.5">
            {chapters.map((ch) => (
              <button
                key={ch}
                onClick={() => handleChapterSelect(ch)}
                className="aspect-square rounded-xl flex items-center justify-center text-[17px] font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  border: "0.5px solid var(--border)",
                }}
              >
                {ch}
              </button>
            ))}
          </div>
        )}

        {/* Verses Tab */}
        {activeTab === "verses" && selectedBook && selectedChapter && (
          <>
            {loadingVerses ? (
              <div className="flex items-center justify-center py-16">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
                />
              </div>
            ) : verseCount > 0 ? (
              <div className="grid grid-cols-5 gap-2.5">
                {verses.map((v) => (
                  <button
                    key={v}
                    onClick={() => handleVerseSelect(v)}
                    className="aspect-square rounded-xl flex items-center justify-center text-[17px] font-semibold transition-all active:scale-95"
                    style={{
                      backgroundColor: "var(--card)",
                      color: "var(--foreground)",
                      border: "0.5px solid var(--border)",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p style={{ color: "var(--secondary)" }}>No verses found for this chapter.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
