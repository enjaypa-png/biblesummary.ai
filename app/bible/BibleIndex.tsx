"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

  // Bookmark state for "Continue Reading"
  const [bookmark, setBookmark] = useState<{
    book_name: string;
    book_slug: string;
    chapter: number;
    verse: number;
  } | null>(null);

  useEffect(() => {
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
  const displayedBooks = testament === "Old" ? oldTestament : newTestament;

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
                fontSize: "20px",
                lineHeight: 1.2,
              }}
            >
              King James Version
            </h1>
            <h2
              className="font-semibold tracking-tight"
              style={{
                color: "var(--foreground)",
                fontSize: "20px",
                lineHeight: 1.2,
              }}
            >
              Holy Bible
            </h2>
            <p
              className="mt-1.5 text-[12px] uppercase tracking-[0.2em] font-medium"
              style={{ color: "var(--foreground-secondary)" }}
            >
              Index
            </p>
          </div>

          {/* Context string (selected book/chapter) */}
          {contextString && (
            <p
              className="text-center mt-3 text-[15px] font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {contextString}
            </p>
          )}

          {/* Tab navigation */}
          <div className="flex mt-4 gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--card)" }}>
            {(["books", "chapters", "verses"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const isDisabled =
                (tab === "chapters" && !selectedBook) ||
                (tab === "verses" && !selectedChapter);

              return (
                <button
                  key={tab}
                  onClick={() => !isDisabled && setActiveTab(tab)}
                  disabled={isDisabled}
                  className="flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all capitalize"
                  style={{
                    backgroundColor: isActive ? "var(--background)" : "transparent",
                    color: isActive
                      ? "var(--foreground)"
                      : isDisabled
                        ? "var(--border)"
                        : "var(--foreground-secondary)",
                    boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    cursor: isDisabled ? "not-allowed" : "pointer",
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
        {/* Continue Reading card */}
        {activeTab === "books" && bookmark && (
          <Link
            href={`/bible/${bookmark.book_slug}/${bookmark.chapter}?verse=${bookmark.verse}`}
            className="flex items-center gap-3.5 mb-5 p-4 rounded-xl active:opacity-80 transition-opacity"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="block text-[11px] uppercase tracking-wider font-medium text-white/70">
                Continue Reading
              </span>
              <span className="block text-[15px] font-semibold text-white truncate">
                {bookmark.book_name} {bookmark.chapter}:{bookmark.verse}
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
            {/* Testament toggle */}
            <div className="flex gap-0 mb-4">
              {(["Old", "New"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTestament(t)}
                  className="flex-1 pb-2.5 text-[14px] font-semibold tracking-wide relative transition-colors"
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
                      className="text-[11px] font-medium w-5 text-right tabular-nums"
                      style={{ color: "var(--border)" }}
                    >
                      {book.order_index}
                    </span>
                    <span
                      className="truncate font-semibold"
                      style={{
                        color: "var(--foreground)",
                        fontSize: "16px",
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
                    <span className="text-[12px] font-medium tabular-nums" style={{ color: "var(--secondary)" }}>
                      {book.total_chapters} ch
                    </span>
                    <svg width="5" height="9" viewBox="0 0 6 10" fill="none">
                      <path d="M1 1L5 5L1 9" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Chapters Tab */}
        {activeTab === "chapters" && selectedBook && (
          <div className="grid grid-cols-5 gap-2.5">
            {chapters.map((ch) => (
              <button
                key={ch}
                onClick={() => handleChapterSelect(ch)}
                className="aspect-square rounded-xl flex items-center justify-center text-[15px] font-medium transition-all active:scale-95"
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
                    className="aspect-square rounded-xl flex items-center justify-center text-[15px] font-medium transition-all active:scale-95"
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
