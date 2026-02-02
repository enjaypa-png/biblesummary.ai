"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Book {
  id: string;
  name: string;
  slug: string;
  total_chapters: number;
  order_index: number;
}

export default function ListenPage() {
  const searchParams = useSearchParams();
  const bookSlug = searchParams.get("book");
  const chapterParam = searchParams.get("chapter");
  
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Audio state
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    supabase
      .from("books")
      .select("id, name, slug, total_chapters, order_index")
      .order("order_index")
      .then(({ data }) => {
        if (data) {
          setBooks(data);
          
          // Priority: URL params > localStorage > default to Genesis
          if (bookSlug) {
            const matchedBook = data.find(b => b.slug === bookSlug);
            setSelectedBook(matchedBook || data[0] || null);
            
            if (chapterParam) {
              const chapterNum = parseInt(chapterParam, 10);
              if (!isNaN(chapterNum) && chapterNum > 0) {
                setSelectedChapter(chapterNum);
              }
            }
          } else {
            // Try to restore last viewed book/chapter from localStorage
            const lastBook = localStorage.getItem('lastViewedBook');
            const lastChapter = localStorage.getItem('lastViewedChapter');
            
            if (lastBook) {
              const matchedBook = data.find(b => b.slug === lastBook);
              if (matchedBook) {
                setSelectedBook(matchedBook);
                if (lastChapter) {
                  const chapterNum = parseInt(lastChapter, 10);
                  if (!isNaN(chapterNum) && chapterNum > 0) {
                    setSelectedChapter(chapterNum);
                  }
                }
              } else {
                setSelectedBook(data[0] || null);
              }
            } else {
              setSelectedBook(data[0] || null);
            }
          }
        }
        setLoading(false);
      });
  }, [bookSlug, chapterParam]);

  useEffect(() => {
    // Reset audio when selection changes
    stopAudio();
    setSelectedChapter(1);
  }, [selectedBook]);

  useEffect(() => {
    stopAudio();
  }, [selectedChapter]);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setAudioState("idle");
    setCurrentTime(0);
    setDuration(0);
    setErrorMsg("");
  }

  async function handlePlay() {
    if (audioState === "playing") {
      audioRef.current?.pause();
      setAudioState("paused");
      return;
    }

    if (audioState === "paused" && audioRef.current) {
      audioRef.current.play();
      setAudioState("playing");
      return;
    }

    // Always stop any existing audio before starting new
    stopAudio();

    if (!selectedBook) return;

    setAudioState("loading");
    setErrorMsg("");

    try {
      // Fetch verses for selected chapter
      const { data: verses } = await supabase
        .from("verses")
        .select("verse, text")
        .eq("book_id", selectedBook.id)
        .eq("chapter", selectedChapter)
        .order("verse");

      if (!verses || verses.length === 0) {
        setErrorMsg("No verses found for this chapter");
        setAudioState("error");
        return;
      }

      // Build text to speak - optimize by limiting initial chunk
      const fullText = verses.map((v) => v.text).join(" ");
      
      // For faster startup, send only first 800 characters initially
      const initialChunk = fullText.slice(0, 800);
      let remainingText = fullText.slice(800);

      // Create audio element and set up listeners immediately
      const audio = new Audio();
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("ended", async () => {
        // If we have remaining text, load it next
        if (remainingText) {
          try {
            const res = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: remainingText }),
            });

            if (res.ok) {
              const blob = await res.blob();
              const nextUrl = URL.createObjectURL(blob);
              
              audio.src = nextUrl;
              await audio.play();
              remainingText = ""; // Clear remaining text
            }
          } catch (error) {
            console.error("Failed to load remaining audio:", error);
          }
        } else {
          setAudioState("idle");
          setCurrentTime(0);
        }
      });

      audio.addEventListener("error", () => {
        setErrorMsg("Audio playback error");
        setAudioState("error");
      });

      // Start with initial chunk immediately
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: initialChunk }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed to generate audio" }));
          setErrorMsg(err.error || "Failed to generate audio");
          setAudioState("error");
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audio.src = url;
        
        await audio.play();
        setAudioState("playing");
      } catch (error) {
        console.error("Initial audio loading failed:", error);
        setErrorMsg("Could not generate audio. Please try again.");
        setAudioState("error");
      }
    } catch {
      setErrorMsg("Could not generate audio. Please try again.");
      setAudioState("error");
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function handlePrev() {
    stopAudio();
    if (selectedChapter > 1) setSelectedChapter(selectedChapter - 1);
  }

  function handleNext() {
    stopAudio();
    if (selectedBook && selectedChapter < selectedBook.total_chapters) {
      setSelectedChapter(selectedChapter + 1);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <p className="text-[14px]" style={{ color: "var(--secondary)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <h1 
          className="font-semibold text-center max-w-lg mx-auto smooth-transition"
          style={{ 
            color: "var(--foreground)",
            fontSize: "var(--text-lg)"
          }}
        >
          Listen
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {/* Book selector */}
        <div className="mb-5">
          <label 
            className="block font-semibold mb-2 smooth-transition"
            style={{ 
              color: "var(--foreground-secondary)",
              fontSize: "var(--text-xs)",
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}
          >
            Book
          </label>
          <select
            value={selectedBook?.slug || ""}
            onChange={(e) => {
              const book = books.find((b) => b.slug === e.target.value);
              if (book) setSelectedBook(book);
            }}
            className="w-full px-4 py-3 rounded-xl outline-none appearance-none smooth-transition modern-button"
            style={{ 
              backgroundColor: "var(--card)", 
              color: "var(--foreground)", 
              border: "1px solid var(--border)",
              fontSize: "var(--text-sm)",
              minHeight: "44px"
            }}
          >
            {books.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Chapter selector */}
        {selectedBook && (
          <div className="mb-8">
            <label className="block text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--secondary)" }}>
              Chapter
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: selectedBook.total_chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setSelectedChapter(ch)}
                  className="aspect-square rounded-xl flex items-center justify-center font-medium smooth-transition modern-button"
                  style={{
                    backgroundColor: ch === selectedChapter ? "var(--accent)" : "var(--card)",
                    color: ch === selectedChapter ? "var(--text-on-accent)" : "var(--foreground)",
                    border: ch === selectedChapter ? "none" : "0.5px solid var(--border)",
                    fontSize: "var(--text-sm)",
                    boxShadow: ch === selectedChapter ? "var(--shadow-md)" : "var(--shadow-sm)",
                    minHeight: "44px",
                    minWidth: "44px"
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Now playing display */}
        {selectedBook && (
          <div 
            className="rounded-2xl p-6 mb-6 smooth-transition"
            style={{ 
              backgroundColor: "var(--card)", 
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)"
            }}
          >
            {/* Book/chapter display */}
            <div className="text-center mb-6">
              <h2
                className="font-semibold tracking-tight smooth-transition"
                style={{ 
                  color: "var(--foreground)", 
                  fontFamily: "'Source Serif 4', Georgia, serif", 
                  fontSize: "var(--text-2xl)" 
                }}
              >
                {selectedBook.name}
              </h2>
              <p 
                className="mt-1 font-semibold smooth-transition"
                style={{ 
                  color: "var(--foreground-secondary)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}
              >
                Chapter {selectedChapter}
              </p>
            </div>

            {/* Progress bar */}
            {(audioState === "playing" || audioState === "paused") && duration > 0 && (
              <div className="mb-5">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "var(--accent)" }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--secondary)" }}>{formatTime(currentTime)}</span>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--secondary)" }}>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handlePrev}
                disabled={selectedChapter <= 1}
                className="w-12 h-12 flex items-center justify-center rounded-full smooth-transition modern-button"
                style={{ minHeight: "44px", minWidth: "44px" }}
                title="Previous chapter"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/>
                  <line x1="5" y1="4" x2="5" y2="20"/>
                </svg>
              </button>

              <button
                onClick={handlePlay}
                disabled={audioState === "loading"}
                className="w-20 h-20 flex items-center justify-center rounded-full smooth-transition"
                style={{ 
                  backgroundColor: "var(--accent)",
                  minHeight: "48px", 
                  minWidth: "48px",
                  boxShadow: audioState === "playing" ? "var(--shadow-lg)" : "var(--shadow-md)"
                }}
                title={audioState === "playing" ? "Pause" : "Play"}
              >
                {audioState === "loading" ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" className="animate-spin">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
                  </svg>
                ) : audioState === "playing" ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="8 4 20 12 8 20 8 4"/>
                  </svg>
                )}
              </button>

              {/* Stop button */}
              <button
                onClick={stopAudio}
                disabled={audioState === "idle" || audioState === "loading"}
                className="w-12 h-12 flex items-center justify-center rounded-full smooth-transition modern-button"
                style={{ minHeight: "44px", minWidth: "44px" }}
                title="Stop playback"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
                </svg>
              </button>

              <button
                onClick={handleNext}
                disabled={!selectedBook || selectedChapter >= selectedBook.total_chapters}
                className="w-12 h-12 flex items-center justify-center rounded-full smooth-transition modern-button"
                style={{ minHeight: "44px", minWidth: "44px" }}
                title="Next chapter"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/>
                  <line x1="19" y1="4" x2="19" y2="20"/>
                </svg>
              </button>
            </div>

            {/* Error message */}
            {audioState === "error" && (
              <div className="mt-4 rounded-lg px-4 py-3 text-[13px] text-center" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                {errorMsg}
              </div>
            )}

            {/* Read along link */}
            <div className="mt-5 text-center">
              <Link
                href={`/bible/${selectedBook.slug}/${selectedChapter}`}
                className="text-[13px] font-medium"
                style={{ color: "var(--accent)" }}
              >
                Read along →
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] tracking-wide" style={{ color: "var(--secondary)" }}>
          KING JAMES VERSION
        </p>
      </main>
    </div>
  );
}