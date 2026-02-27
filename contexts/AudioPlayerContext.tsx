"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useReadingSettings } from "@/contexts/ReadingSettingsContext";

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
  currentlyPlayingVerse: number | null;
  totalVerses: number;

  // Current track identifier
  currentTrackId: string | null;

  // Actions
  play: (book?: Book, chapter?: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;

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
  const { settings } = useReadingSettings();
  const voiceIdRef = useRef(settings.voiceId);
  voiceIdRef.current = settings.voiceId;
  const translationRef = useRef(settings.translation || "ct");
  translationRef.current = settings.translation || "ct";

  // Books cache
  const [books, setBooks] = useState<Book[]>([]);

  // Selection state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  // Audio state
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [currentlyPlayingVerse, setCurrentlyPlayingVerse] = useState<number | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [totalVerses, setTotalVerses] = useState(0);

  // Refs for verse-by-verse playback (single persistent audio element)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const shouldContinueRef = useRef<boolean>(false);
  const versesRef = useRef<Verse[]>([]);
  const currentVerseIndexRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const blobRef = useRef<Blob | null>(null); // Keep blob alive until verse ends (mobile)
  const mountedRef = useRef<boolean>(true);

  // Load books from database
  const loadBooks = useCallback(async () => {
    if (books.length > 0) return;

    const { data } = await supabase
      .from("books")
      .select("id, name, slug, total_chapters, order_index")
      .order("order_index");

    if (data) {
      setBooks(data);

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
    localStorage.setItem('lastViewedBook', book.slug);
    localStorage.setItem('lastViewedChapter', chapter.toString());
  }, []);

  // Stop audio completely (keeps persistent audio element for reuse)
  const stop = useCallback(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("[Audio] stop called");
    }

    shouldContinueRef.current = false;
    isPausedRef.current = false;
    blobRef.current = null;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      // Do NOT set audioRef.current = null - reuse the same element for mobile stability
    }

    if (mountedRef.current) {
      setAudioState("idle");
      setErrorMsg("");
      setCurrentlyPlayingVerse(null);
      setCurrentTrackId(null);
      setTotalVerses(0);
    }
    versesRef.current = [];
    currentVerseIndexRef.current = 0;
  }, []);

  // Pause audio
  const pause = useCallback(() => {
    if (audioRef.current && audioState === "playing") {
      audioRef.current.pause();
      isPausedRef.current = true;
      setAudioState("paused");
    }
  }, [audioState]);

  // Resume audio
  const resume = useCallback(() => {
    if (audioRef.current && audioState === "paused") {
      isPausedRef.current = false;
      audioRef.current.play();
      setAudioState("playing");
    }
  }, [audioState]);

  // Play a single verse using the persistent audio element (mobile-safe: no new Audio() per verse)
  const playVerse = useCallback(async (verse: Verse, abortSignal: AbortSignal): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        // Check if we should stop
        if (!shouldContinueRef.current || abortSignal.aborted) {
          resolve(false);
          return;
        }

        const audio = audioRef.current;
        if (!audio) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[Audio] Persistent audio element not ready");
          }
          resolve(false);
          return;
        }

        // Set current verse immediately when starting to load
        setCurrentlyPlayingVerse(verse.verse);

        // Scroll to verse
        setTimeout(() => {
          const verseElement = document.querySelector(`[data-verse="${verse.verse}"]`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        // Fetch TTS for this verse
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: verse.text, voiceId: voiceIdRef.current }),
          signal: abortSignal,
        });

        if (!res.ok || !shouldContinueRef.current) {
          if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            console.error(`[Audio] TTS failed for verse ${verse.verse}: ${res.status} ${res.statusText}`, errBody);
          }
          resolve(false);
          return;
        }

        const blob = await res.blob();
        if (!shouldContinueRef.current) {
          resolve(false);
          return;
        }

        blobRef.current = blob; // Keep blob alive until verse ends (prevents mobile GC)
        const url = URL.createObjectURL(blob);
        audio.src = url;

        const onEnded = () => {
          blobRef.current = null;
          URL.revokeObjectURL(url);
          resolve(true);
        };

        const onError = (e: Event) => {
          const mediaError = (e.target as HTMLAudioElement)?.error;
          console.error(`[Audio] Playback error for verse ${verse.verse}:`, mediaError?.message || "unknown");
          blobRef.current = null;
          URL.revokeObjectURL(url);
          resolve(false);
        };

        audio.addEventListener("ended", onEnded, { once: true });
        audio.addEventListener("error", onError, { once: true });

        await audio.play();
        setAudioState("playing");

        // Media Session API for lock screen / notification controls (mobile)
        if (typeof navigator !== "undefined" && "mediaSession" in navigator && typeof MediaMetadata !== "undefined") {
          try {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: `Verse ${verse.verse}`,
              artist: "Bible Summary",
            });
          } catch (_) {}
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          resolve(false);
          return;
        }
        blobRef.current = null;
        console.error("Verse playback error:", error);
        resolve(false);
      }
    });
  }, []);

  // Play all verses sequentially (skips failed verses instead of stopping)
  const playVerses = useCallback(async (verses: Verse[], startIndex: number = 0) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let consecutiveFailures = 0;

    for (let i = startIndex; i < verses.length; i++) {
      // Check if we should stop
      if (!shouldContinueRef.current) break;

      // Wait while paused
      while (isPausedRef.current && shouldContinueRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!shouldContinueRef.current) break;

      currentVerseIndexRef.current = i;
      let success = await playVerse(verses[i], abortController.signal);

      // Retry once on failure before skipping
      if (!success && shouldContinueRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
        success = await playVerse(verses[i], abortController.signal);
      }

      if (success) {
        consecutiveFailures = 0;
      } else if (shouldContinueRef.current) {
        consecutiveFailures++;
        console.warn(`[Audio] Verse ${verses[i].verse} failed, skipping (${consecutiveFailures} consecutive failures)`);
        // Stop only if 3+ consecutive verses fail (likely API is down)
        if (consecutiveFailures >= 3) {
          console.error("[Audio] Too many consecutive failures, stopping playback");
          break;
        }
      }
    }

    // Finished all verses or stopped
    if (shouldContinueRef.current) {
      setAudioState("idle");
      setCurrentlyPlayingVerse(null);
    }
  }, [playVerse]);

  // Main play function
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
    isPausedRef.current = false;
    setAudioState("loading");
    setErrorMsg("");
    setCurrentTrackId(newTrackId);

    try {
      // Fetch verses for the chapter in the current translation
      const { data: verses } = await supabase
        .from("verses")
        .select("id, verse, text")
        .eq("book_id", targetBook.id)
        .eq("chapter", targetChapter)
        .eq("translation", translationRef.current)
        .order("verse");

      if (!verses || verses.length === 0) {
        setErrorMsg("No verses found for this chapter");
        setAudioState("error");
        return;
      }

      if (!shouldContinueRef.current) return;

      versesRef.current = verses;
      setTotalVerses(verses.length);
      currentVerseIndexRef.current = 0;

      // Start playing verses sequentially
      await playVerses(verses, 0);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error("Audio error:", error);
      setErrorMsg("Could not generate audio");
      setAudioState("error");
    }
  }, [selectedBook, selectedChapter, currentTrackId, audioState, stop, resume, pause, setSelection, playVerses]);

  // Initialize persistent audio element with mobile-safe attributes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
  }, []);

  // Handle visibility change: iOS may pause when tab is backgrounded; resume when visible
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && audioRef.current && !isPausedRef.current && shouldContinueRef.current) {
        const el = audioRef.current;
        if (el.paused && el.currentTime > 0 && el.currentTime < el.duration) {
          if (process.env.NODE_ENV === "development") {
            console.log("[Audio] visibilitychange: resuming after tab visible");
          }
          el.play().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Cleanup on unmount only (defensive: mountedRef prevents state updates after unmount)
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (process.env.NODE_ENV === "development") {
        console.log("[Audio] cleanup on unmount");
      }
      stop();
    };
  }, [stop]);

  const value: AudioPlayerContextType = {
    selectedBook,
    selectedChapter,
    setSelection,
    audioState,
    errorMsg,
    currentlyPlayingVerse,
    totalVerses,
    currentTrackId,
    play,
    pause,
    resume,
    stop,
    books,
    loadBooks,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {/* Single persistent audio element - reused for all verses (mobile-safe, no new Audio() per segment) */}
      <audio
        ref={audioRef}
        playsInline
        style={{ display: "none" }}
        preload="metadata"
      />
      {children}
    </AudioPlayerContext.Provider>
  );
}
