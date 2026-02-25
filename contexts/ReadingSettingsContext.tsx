"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
export { DEFAULT_VOICE_ID, VOICE_IDS } from "@/lib/voiceIds";
import { DEFAULT_VOICE_ID } from "@/lib/voiceIds";

export type FontFamily = "Libre Baskerville" | "Spectral" | "Source Sans 3" | "System";
export type ThemeMode = "light" | "sepia" | "gray" | "dark";
export type BibleTranslation = "ct" | "kjv";

export const TRANSLATION_LABELS: Record<BibleTranslation, { name: string; fullName: string; auditStatus?: string }> = {
  ct: { name: "Clear Bible Translation", fullName: "Clear Bible Translation", auditStatus: "Under Review" },
  kjv: { name: "KJV", fullName: "King James Version" },
};

interface ReadingSettings {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  themeMode: ThemeMode;
  voiceId: string;
  translation: BibleTranslation;
}

interface ReadingSettingsContextType {
  settings: ReadingSettings;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setVoiceId: (voiceId: string) => void;
  setTranslation: (translation: BibleTranslation) => void;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const defaultSettings: ReadingSettings = {
  fontFamily: "Libre Baskerville",
  fontSize: 18,
  lineHeight: 1.9,
  themeMode: "light",
  voiceId: DEFAULT_VOICE_ID,
  translation: "ct",
};

const ReadingSettingsContext = createContext<ReadingSettingsContextType | null>(null);

export function useReadingSettings() {
  const context = useContext(ReadingSettingsContext);
  if (!context) {
    throw new Error("useReadingSettings must be used within a ReadingSettingsProvider");
  }
  return context;
}

// Theme configurations
export const themeStyles: Record<ThemeMode, { background: string; text: string; secondary: string; border: string; card: string }> = {
  light: {
    background: "#FFFFFF",
    text: "#1a1a1a",
    secondary: "#6b7280",
    border: "rgba(0, 0, 0, 0.08)",
    card: "#f9fafb",
  },
  sepia: {
    background: "#F8F1E3",
    text: "#5c4b37",
    secondary: "#8b7355",
    border: "rgba(92, 75, 55, 0.15)",
    card: "#f0e6d3",
  },
  gray: {
    background: "#E8E8E8",
    text: "#2d2d2d",
    secondary: "#666666",
    border: "rgba(0, 0, 0, 0.1)",
    card: "#dedede",
  },
  dark: {
    background: "#1a1a1a",
    text: "#e5e5e5",
    secondary: "#9ca3af",
    border: "rgba(255, 255, 255, 0.1)",
    card: "#262626",
  },
};

export function ReadingSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ReadingSettings>(defaultSettings);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("readingSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          fontFamily: parsed.fontFamily || defaultSettings.fontFamily,
          fontSize: parsed.fontSize || defaultSettings.fontSize,
          lineHeight: parsed.lineHeight || defaultSettings.lineHeight,
          themeMode: parsed.themeMode || defaultSettings.themeMode,
          voiceId: parsed.voiceId || defaultSettings.voiceId,
          translation: parsed.translation || defaultSettings.translation,
        });
      } catch (e) {
        console.error("Failed to parse reading settings:", e);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("readingSettings", JSON.stringify(settings));
    }
  }, [settings, isHydrated]);

  const setFontFamily = useCallback((font: FontFamily) => {
    setSettings((prev) => ({ ...prev, fontFamily: font }));
  }, []);

  const setFontSize = useCallback((size: number) => {
    setSettings((prev) => ({ ...prev, fontSize: size }));
  }, []);

  const setLineHeight = useCallback((height: number) => {
    setSettings((prev) => ({ ...prev, lineHeight: height }));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setSettings((prev) => ({ ...prev, themeMode: mode }));
  }, []);

  const setVoiceId = useCallback((voiceId: string) => {
    setSettings((prev) => ({ ...prev, voiceId }));
  }, []);

  const setTranslation = useCallback((translation: BibleTranslation) => {
    setSettings((prev) => ({ ...prev, translation }));
  }, []);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  const value: ReadingSettingsContextType = {
    settings,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setThemeMode,
    setVoiceId,
    setTranslation,
    isPanelOpen,
    openPanel,
    closePanel,
  };

  return (
    <ReadingSettingsContext.Provider value={value}>
      {children}
    </ReadingSettingsContext.Provider>
  );
}
