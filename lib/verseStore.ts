import { create } from "zustand";

interface SelectedVerse {
  book: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  text: string;
}

interface CachedExplanation {
  text: string;
  createdAt: string;
}

interface ExplainState {
  selectedVerse: SelectedVerse | null;
  explanation: string | null;
  explainStatus: "idle" | "loading" | "success" | "error";
  cache: Record<string, CachedExplanation>;

  // Actions
  setSelectedVerse: (verse: SelectedVerse | null) => void;
  clearSelectedVerse: () => void;
  setExplanation: (explanation: string | null) => void;
  setExplainStatus: (status: "idle" | "loading" | "success" | "error") => void;
  addToCache: (verseId: string, text: string) => void;
  getFromCache: (verseId: string) => CachedExplanation | null;
  resetExplanation: () => void;
}

export const useVerseStore = create<ExplainState>((set, get) => ({
  selectedVerse: null,
  explanation: null,
  explainStatus: "idle",
  cache: {},

  setSelectedVerse: (verse) => {
    set({
      selectedVerse: verse,
      // Reset explanation when selecting a new verse
      explanation: null,
      explainStatus: "idle",
    });
  },

  clearSelectedVerse: () => {
    set({
      selectedVerse: null,
      explanation: null,
      explainStatus: "idle",
    });
  },

  setExplanation: (explanation) => {
    set({ explanation });
  },

  setExplainStatus: (status) => {
    set({ explainStatus: status });
  },

  addToCache: (verseId, text) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [verseId]: {
          text,
          createdAt: new Date().toISOString(),
        },
      },
    }));
  },

  getFromCache: (verseId) => {
    const state = get();
    return state.cache[verseId] || null;
  },

  resetExplanation: () => {
    set({
      explanation: null,
      explainStatus: "idle",
    });
  },
}));

// Helper to generate verse ID
export function getVerseId(book: string, chapter: number, verse: number): string {
  return `${book}.${chapter}.${verse}`;
}
