import { create } from "zustand";

interface CachedExplanation {
  text: string;
  createdAt: string;
}

interface ExplanationCacheState {
  cache: Record<string, CachedExplanation>;
  addToCache: (verseId: string, text: string) => void;
  getFromCache: (verseId: string) => CachedExplanation | null;
}

export const useExplanationCache = create<ExplanationCacheState>((set, get) => ({
  cache: {},

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
}));

// Helper to generate verse ID
export function getVerseId(book: string, chapter: number, verse: number): string {
  return `${book}.${chapter}.${verse}`;
}
