"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type FontFamily = "Libre Baskerville" | "Spectral" | "Source Sans 3" | "System";
export type ThemeMode = "light" | "sepia" | "gray" | "dark";

// Default narrator voice (Daniel)
export const DEFAULT_VOICE_ID = "onwK4e9ZLuTAKqWW03F9";

// All available narrator voices
export const VOICE_IDS = [
  "onwK4e9ZLuTAKqWW03F9",
  "Xn1azbd8NmVXRrY94yrw",
  "vIpTnd6yyGAk2tJwEHLY",
  "iN4bGoWlozzDpJuOdZjH",
  "W0CVI7WJhHuV2vFY3VcB",
  "zwbQ2XUiIlOKD6b3JWXd",
  "h8LZpYr8y3VBz0q2x0LP",
  "CVRACyqNcQefTlxMj9bt",
] as const;

interface ReadingSettings {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  themeMode: ThemeMode;
  voiceId: string;
}

interface ReadingSettingsContextType {
  settings: ReadingSettings;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setVoiceId: (voiceId: string) => void;
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

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  const value: ReadingSettingsContextType = {
    settings,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setThemeMode,
    setVoiceId,
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
