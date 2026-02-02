"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Book {
  id: string;
  name: string;
  slug: string;
  total_chapters: number;
  order_index: number;
}

export default function ListenPage() {
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
          setSelectedBook(data[0] || null);
        }
        setLoading(false);
      });
  }, []);

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

      // Build text to speak
      const text = verses.map((v) => v.text).join(" ");

      // Call TTS API
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to generate audio" }));
        setErrorMsg(err.error || "Failed to generate audio");
        setAudioState("error");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setAudioState("idle");
        setCurrentTime(0);
      });

      audio.addEventListener("error", () => {
        setErrorMsg("Audio playback error");
        setAudioState("error");
      });

      await audio.play();
      setAudioState("playing");
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
        <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
          Listen
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {/* Book selector */}
        <div className="mb-5">
          <label className="block text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--secondary)" }}>
            Book
          </label>
          <select
            value={selectedBook?.slug || ""}
            onChange={(e) => {
              const book = books.find((b) => b.slug === e.target.value);
              if (book) setSelectedBook(book);
            }}
            className="w-full px-4 py-2.5 rounded-lg text-[15px] outline-none appearance-none"
            style={{ backgroundColor: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
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
                  className="aspect-square rounded-lg flex items-center justify-center text-[13px] font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: ch === selectedChapter ? "var(--accent)" : "var(--card)",
                    color: ch === selectedChapter ? "#fff" : "var(--foreground)",
                    border: ch === selectedChapter ? "none" : "0.5px solid var(--border)",
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
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            {/* Book/chapter display */}
            <div className="text-center mb-6">
              <h2
                className="font-semibold tracking-tight"
                style={{ color: "var(--foreground)", fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "clamp(1.5rem, 5vw, 2rem)" }}
              >
                {selectedBook.name}
              </h2>
              <p className="mt-1 text-[13px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--secondary)" }}>
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
                className="w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-30"
                title="Previous chapter"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="19 20 9 12 19 4 19 20" fill="var(--foreground)"/>
                  <line x1="5" y1="4" x2="5" y2="20"/>
                </svg>
              </button>

              <button
                onClick={handlePlay}
                disabled={audioState === "loading"}
                className="w-16 h-16 flex items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}
                title={audioState === "playing" ? "Pause" : "Play"}
              >
                {audioState === "loading" ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" className="animate-spin">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
                  </svg>
                ) : audioState === "playing" ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <polygon points="8 4 20 12 8 20 8 4"/>
                  </svg>
                )}
              </button>

              {/* Stop button */}
              <button
                onClick={stopAudio}
                disabled={audioState === "idle" || audioState === "loading"}
                className="w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-30"
                title="Stop playback"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="6" width="12" height="12" fill="var(--foreground)"/>
                </svg>
              </button>

              <button
                onClick={handleNext}
                disabled={!selectedBook || selectedChapter >= selectedBook.total_chapters}
                className="w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-30"
                title="Next chapter"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4" fill="var(--foreground)"/>
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