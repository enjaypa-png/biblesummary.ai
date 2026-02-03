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

  // Refs for verse-by-verse playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const shouldContinueRef = useRef<boolean>(false);
  const versesRef = useRef<Verse[]>([]);
  const currentVerseIndexRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

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

  // Stop audio completely
  const stop = useCallback(() => {
    shouldContinueRef.current = false;
    isPausedRef.current = false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    setAudioState("idle");
    setErrorMsg("");
    setCurrentlyPlayingVerse(null);
    setCurrentTrackId(null);
    setTotalVerses(0);
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

  // Play a single verse and return a promise that resolves when done
  const playVerse = useCallback(async (verse: Verse, abortSignal: AbortSignal): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        // Check if we should stop
        if (!shouldContinueRef.current || abortSignal.aborted) {
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
          body: JSON.stringify({ text: verse.text }),
          signal: abortSignal,
        });

        if (!res.ok || !shouldContinueRef.current) {
          resolve(false);
          return;
        }

        const blob = await res.blob();
        if (!shouldContinueRef.current) {
          resolve(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.addEventListener("ended", () => {
          URL.revokeObjectURL(url);
          resolve(true);
        });

        audio.addEventListener("error", () => {
          URL.revokeObjectURL(url);
          resolve(false);
        });

        await audio.play();
        setAudioState("playing");

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          resolve(false);
          return;
        }
        console.error("Verse playback error:", error);
        resolve(false);
      }
    });
  }, []);

  // Play all verses sequentially
  const playVerses = useCallback(async (verses: Verse[], startIndex: number = 0) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    for (let i = startIndex; i < verses.length; i++) {
      // Check if we should stop
      if (!shouldContinueRef.current) break;

      // Wait while paused
      while (isPausedRef.current && shouldContinueRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!shouldContinueRef.current) break;

      currentVerseIndexRef.current = i;
      const success = await playVerse(verses[i], abortController.signal);

      if (!success && shouldContinueRef.current) {
        // Error occurred, stop playback
        break;
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
      {children}
    </AudioPlayerContext.Provider>
  );
}
