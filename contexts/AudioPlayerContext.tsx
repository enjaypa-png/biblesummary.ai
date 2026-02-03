"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Book {
  id: string;
  name: string;
  slug: string;
  total_chapters: number;
  order_index: number;
}

interface Verse {
  id: string;
  verse: number;
  text: string;
}

type AudioState = "idle" | "loading" | "playing" | "paused" | "error";

interface AudioPlayerContextType {
  // Selection state
  selectedBook: Book | null;
  selectedChapter: number;
  setSelection: (book: Book, chapter: number) => void;

  // Audio state
  audioState: AudioState;
  errorMsg: string;
  currentTime: number;
  duration: number;
  currentlyPlayingVerse: number | null;

  // Current track identifier
  currentTrackId: string | null;

  // Actions
  play: (book?: Book, chapter?: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;

  // Books list (cached)
  books: Book[];
  loadBooks: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  // Books cache
  const [books, setBooks] = useState<Book[]>([]);

  // Selection state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  // Audio state
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentlyPlayingVerse, setCurrentlyPlayingVerse] = useState<number | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  // Refs for audio management
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const shouldContinueRef = useRef<boolean>(false);
  const highlightIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const versesRef = useRef<Verse[]>([]);
  const remainingTextRef = useRef<string>("");

  // Load books from database
  const loadBooks = useCallback(async () => {
    if (books.length > 0) return; // Already loaded

    const { data } = await supabase
      .from("books")
      .select("id, name, slug, total_chapters, order_index")
      .order("order_index");

    if (data) {
      setBooks(data);

      // Initialize selection from localStorage if not set
      if (!selectedBook) {
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
  }, [books.length, selectedBook]);

  // Set selection (book + chapter)
  const setSelection = useCallback((book: Book, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);

    // Persist to localStorage
    localStorage.setItem('lastViewedBook', book.slug);
    localStorage.setItem('lastViewedChapter', chapter.toString());
  }, []);

  // Stop audio completely
  const stop = useCallback(() => {
    shouldContinueRef.current = false;

    // Abort any pending fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear highlighting interval
    if (highlightIntervalRef.current) {
      clearInterval(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }

    // Stop and cleanup audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      audioRef.current = null;
    }

    setAudioState("idle");
    setErrorMsg("");
    setCurrentTime(0);
    setDuration(0);
    setCurrentlyPlayingVerse(null);
    setCurrentTrackId(null);
    remainingTextRef.current = "";
    versesRef.current = [];
  }, []);

  // Pause audio
  const pause = useCallback(() => {
    if (audioRef.current && audioState === "playing") {
      audioRef.current.pause();
      setAudioState("paused");

      // Pause verse highlighting
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
        highlightIntervalRef.current = null;
      }
    }
  }, [audioState]);

  // Resume audio
  const resume = useCallback(() => {
    if (audioRef.current && audioState === "paused") {
      audioRef.current.play();
      setAudioState("playing");

      // Resume verse highlighting
      if (versesRef.current.length > 0) {
        const estimatedVerseIndex = Math.floor(audioRef.current.currentTime / 3);
        let currentVerseIndex = Math.max(0, Math.min(estimatedVerseIndex, versesRef.current.length - 1));

        highlightIntervalRef.current = setInterval(() => {
          if (currentVerseIndex < versesRef.current.length && shouldContinueRef.current) {
            const verseNumber = versesRef.current[currentVerseIndex].verse;
            setCurrentlyPlayingVerse(verseNumber);

            // Auto-scroll to currently playing verse
            const verseElement = document.querySelector(`[data-verse="${verseNumber}"]`);
            if (verseElement) {
              verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            currentVerseIndex++;
          } else {
            if (highlightIntervalRef.current) {
              clearInterval(highlightIntervalRef.current);
              highlightIntervalRef.current = null;
            }
            setCurrentlyPlayingVerse(null);
          }
        }, 3000);
      }
    }
  }, [audioState]);

  // Play audio
  const play = useCallback(async (book?: Book, chapter?: number) => {
    const targetBook = book || selectedBook;
    const targetChapter = chapter || selectedChapter;

    if (!targetBook) return;

    const newTrackId = `${targetBook.slug}:${targetChapter}`;

    // If same track and paused, just resume
    if (currentTrackId === newTrackId && audioState === "paused") {
      resume();
      return;
    }

    // If same track and playing, pause it
    if (currentTrackId === newTrackId && audioState === "playing") {
      pause();
      return;
    }

    // Stop any existing audio first
    stop();

    // Update selection if provided
    if (book && chapter) {
      setSelection(book, chapter);
    }

    shouldContinueRef.current = true;
    setAudioState("loading");
    setErrorMsg("");
    setCurrentTrackId(newTrackId);

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const playbackAbortController = abortControllerRef.current;

    try {
      // Fetch verses for the chapter
      const { data: verses } = await supabase
        .from("verses")
        .select("id, verse, text")
        .eq("book_id", targetBook.id)
        .eq("chapter", targetChapter)
        .order("verse");

      if (!verses || verses.length === 0) {
        setErrorMsg("No verses found for this chapter");
        setAudioState("error");
        return;
      }

      // Check if we were stopped during fetch
      if (!shouldContinueRef.current) return;

      versesRef.current = verses;

      // Build text to speak - use first 800 chars for fast start
      const fullText = verses.map((v) => v.text).join(" ");
      const initialChunk = fullText.slice(0, 800);
      remainingTextRef.current = fullText.slice(800);

      // Fetch initial audio
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: initialChunk }),
        signal: playbackAbortController.signal,
      });

      if (!shouldContinueRef.current) return;

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to generate audio" }));
        setErrorMsg(err.error || "Failed to generate audio");
        setAudioState("error");
        return;
      }

      const blob = await res.blob();
      if (!shouldContinueRef.current) return;

      const url = URL.createObjectURL(blob);

      // Create audio element
      const audio = new Audio();
      audioRef.current = audio;
      audio.src = url;

      // Event listeners
      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("ended", async () => {
        // Load remaining text if exists
        if (remainingTextRef.current && shouldContinueRef.current) {
          try {
            const res = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: remainingTextRef.current }),
              signal: playbackAbortController.signal,
            });

            if (res.ok && shouldContinueRef.current) {
              const blob = await res.blob();
              const nextUrl = URL.createObjectURL(blob);
              audio.src = nextUrl;
              await audio.play();
              remainingTextRef.current = "";
            }
          } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error("Failed to load remaining audio:", error);
            }
            if (shouldContinueRef.current) {
              setAudioState("idle");
              setCurrentlyPlayingVerse(null);
            }
          }
        } else {
          setAudioState("idle");
          setCurrentTime(0);
          setCurrentlyPlayingVerse(null);
          if (highlightIntervalRef.current) {
            clearInterval(highlightIntervalRef.current);
            highlightIntervalRef.current = null;
          }
        }
      });

      audio.addEventListener("error", () => {
        if (shouldContinueRef.current) {
          setErrorMsg("Audio playback error");
          setAudioState("error");
        }
      });

      // Check one more time before playing
      if (!shouldContinueRef.current) {
        URL.revokeObjectURL(url);
        return;
      }

      await audio.play();
      setAudioState("playing");

      // Start verse highlighting
      let currentVerseIndex = 0;
      highlightIntervalRef.current = setInterval(() => {
        if (currentVerseIndex < versesRef.current.length && shouldContinueRef.current) {
          const verseNumber = versesRef.current[currentVerseIndex].verse;
          setCurrentlyPlayingVerse(verseNumber);

          // Auto-scroll to currently playing verse
          const verseElement = document.querySelector(`[data-verse="${verseNumber}"]`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          currentVerseIndex++;
        } else {
          if (highlightIntervalRef.current) {
            clearInterval(highlightIntervalRef.current);
            highlightIntervalRef.current = null;
          }
          setCurrentlyPlayingVerse(null);
        }
      }, 3000);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Expected when stop is clicked
      }
      console.error("Audio error:", error);
      setErrorMsg("Could not generate audio");
      setAudioState("error");
    }
  }, [selectedBook, selectedChapter, currentTrackId, audioState, stop, resume, pause, setSelection]);

  // Seek to time
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const value: AudioPlayerContextType = {
    selectedBook,
    selectedChapter,
    setSelection,
    audioState,
    errorMsg,
    currentTime,
    duration,
    currentlyPlayingVerse,
    currentTrackId,
    play,
    pause,
    resume,
    stop,
    seek,
    books,
    loadBooks,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
