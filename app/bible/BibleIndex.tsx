"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useReadingSettings, TRANSLATION_LABELS } from "@/contexts/ReadingSettingsContext";
import AISearchModal from "@/components/AISearchModal";

interface Book {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  testament: string;
  total_chapters: number;
}

type IndexTab = "books" | "chapters" | "verses";

interface ParsedReference {
  book: Book;
  chapter: number;
  verse: number | null;
}

function looksLikeQuestion(input: string): boolean {
  const q = input.trim();
  if (!q) return false;
  if (q.includes("?")) return true;
  const words = q.split(/\s+/);
  return words.length >= 4;
}

function BibleAISearch({
  searchQuery,
  setSearchQuery,
  parsedReference,
  onGoToReference,
  books,
  onOpenAiSearch,
  inputRef,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  parsedReference: ParsedReference | null;
  onGoToReference: () => void;
  books: Book[];
  onOpenAiSearch: (query: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  function handleEnter() {
    const q = searchQuery.trim();
    if (!q) return;
    if (parsedReference) {
      onGoToReference();
      return;
    }
    // If it's clearly just a short book-name filter (1-2 words, matches a book), let the list handle it
    const lower = q.toLowerCase();
    const words = q.split(/\s+/);
    const matchesBook = books.some((b) => b.name.toLowerCase().startsWith(lower));
    if (matchesBook && words.length <= 2) {
      return;
    }
    // For anything else (questions, longer queries), open AI search modal
    if (q.length >= 3) {
      onOpenAiSearch(q);
    }
  }

  return (
    <div className="mt-4">
      <style>{`
        @keyframes indexPulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(124, 92, 252, 0.1), 0 2px 12px rgba(124, 92, 252, 0.08); }
          50% { box-shadow: 0 0 20px rgba(124, 92, 252, 0.18), 0 2px 12px rgba(124, 92, 252, 0.12); }
        }
        @keyframes indexPulseGlowFocused {
          0%, 100% { box-shadow: 0 0 16px rgba(124, 92, 252, 0.2), 0 2px 14px rgba(124, 92, 252, 0.14); }
          50% { box-shadow: 0 0 28px rgba(124, 92, 252, 0.3), 0 2px 14px rgba(124, 92, 252, 0.18); }
        }
        .bible-index-search-bar {
          position: relative;
          border-radius: 50px;
          padding: 2px;
          background: linear-gradient(135deg, #7c5cfc, #a78bfa, #c4b5fd, #7c5cfc);
          animation: indexPulseGlow 3s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        .bible-index-search-bar:focus-within {
          animation: indexPulseGlowFocused 2s ease-in-out infinite;
        }
        .bible-index-search-inner {
          display: flex;
          align-items: center;
          width: 100%;
          border-radius: 48px;
          padding: 4px 4px 4px 16px;
          background: var(--card);
        }
      `}</style>
      {/* AI-POWERED label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          marginBottom: 10,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--accent)",
          fontFamily: "'Inter', 'DM Sans', sans-serif",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)">
          <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
        </svg>
        AI-Powered Bible Search
      </div>
      <div className="bible-index-search-bar">
        <div className="bible-index-search-inner">
          {/* Sparkle icon */}
          <span className="flex-shrink-0 flex items-center" style={{ color: "var(--accent)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleEnter();
              }
            }}
            placeholder="Ask ClearBible AI..."
            className="flex-1 min-w-0 bg-transparent text-[14px] outline-none py-2.5 px-3"
            style={{
              color: "var(--foreground)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          {searchQuery ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleEnter()}
                className="px-5 py-2 rounded-full text-[13px] font-bold active:opacity-70"
                style={{
                  background: "linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 10px rgba(124, 92, 252, 0.3)",
                }}
              >
                Ask AI
              </button>
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 mr-1 rounded-full active:opacity-70"
                style={{ color: "var(--secondary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (inputRef?.current) inputRef.current.focus();
              }}
              className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-bold"
              style={{
                background: "linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%)",
                color: "#fff",
                boxShadow: "0 2px 10px rgba(124, 92, 252, 0.3)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
              </svg>
              Ask AI
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BibleIndex({ books }: { books: Book[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useReadingSettings();
  const translationInfo = TRANSLATION_LABELS[settings.translation || "ct"];

  // Navigation state
  const [activeTab, setActiveTab] = useState<IndexTab>("books");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verseCount, setVerseCount] = useState<number>(0);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // AI search modal state (lifted here so modal renders outside the header's stacking context)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState("");

  // Auto-focus search input when navigating via "Ask AI" tab
  useEffect(() => {
    if (searchParams.get("askai") === "1" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchParams]);

  // Automatic reading position from localStorage
  const [readingPosition, setReadingPosition] = useState<{
    bookSlug: string;
    bookName: string;
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
  }, []);

  // Testament filter for books tab
  const [testament, setTestament] = useState<"Old" | "New">("Old");

  const oldTestament = books.filter((b) => b.testament === "Old");
  const newTestament = books.filter((b) => b.testament === "New");
  const allBooks = testament === "Old" ? oldTestament : newTestament;

  // Parse search query for verse reference navigation (e.g., "Genesis 1:3", "Gen 1", "1 John 3:16")
  const parsedReference: ParsedReference | null = useMemo(() => {
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
          .eq("chapter", selectedChapter)
          .eq("translation", settings.translation || "ct");

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
  }, [selectedBook, selectedChapter, settings.translation]);

  // Handle book selection
  function handleBookSelect(book: Book) {
    setSelectedBook(book);
    setSelectedChapter(null);
    setVerseCount(0);
    setActiveTab("chapters");
    setSearchQuery("");
    window.scrollTo(0, 0);
  }

  // Handle chapter selection
  function handleChapterSelect(chapter: number) {
    setSelectedChapter(chapter);
    setActiveTab("verses");
    window.scrollTo(0, 0);
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
    window.scrollTo(0, 0);
  }

  // Handle tab clicks — navigate to the tab, resetting deeper state if needed
  function handleTabClick(tab: IndexTab) {
    if (tab === "books") {
      setActiveTab("books");
      setSelectedBook(null);
      setSelectedChapter(null);
      setVerseCount(0);
      window.scrollTo(0, 0);
    } else if (tab === "chapters") {
      if (selectedBook) {
        setActiveTab("chapters");
        setSelectedChapter(null);
        setVerseCount(0);
        window.scrollTo(0, 0);
      }
    } else if (tab === "verses") {
      if (selectedBook && selectedChapter) {
        setActiveTab("verses");
        window.scrollTo(0, 0);
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
        <div className="max-w-3xl mx-auto px-5 pt-5 pb-3">
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
              {translationInfo.fullName}
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

          {/* Search + Testament toggle — sticky when on Books tab */}
          {activeTab === "books" && (
            <>
              <BibleAISearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                parsedReference={parsedReference}
                onGoToReference={handleGoToReference}
                books={books}
                inputRef={searchInputRef}
                onOpenAiSearch={(q) => {
                  setAiSearchQuery(q);
                  setShowAiModal(true);
                  setSearchQuery("");
                }}
              />

              <div className="flex gap-0 mt-3 mb-2">
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
            </>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pt-4 pb-8">
        {/* Continue Reading card (automatic reading position) */}
        {activeTab === "books" && readingPosition && (
          <Link
            href={`/bible/${readingPosition.bookSlug}/${readingPosition.chapter}?verse=${readingPosition.verse}`}
            className="flex items-center gap-4 mb-4 p-5 rounded-2xl active:opacity-80 transition-opacity"
            style={{
              backgroundColor: "var(--accent)",
              boxShadow: "0 4px 16px rgba(124, 92, 252, 0.3)",
            }}
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

        {/* Books Tab */}
        {activeTab === "books" && (
          <>
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

      {/* AI Search Modal — rendered outside header to avoid backdrop-filter stacking context */}
      <AISearchModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        initialQuery={aiSearchQuery}
        onSelectVerse={(slug, chapter, verse) => {
          setShowAiModal(false);
          setSearchQuery("");
          router.push(`/bible/${slug}/${chapter}?verse=${verse}`);
        }}
      />
    </div>
  );
}
