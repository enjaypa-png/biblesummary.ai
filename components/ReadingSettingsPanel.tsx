"use client";

import { useEffect, useRef, useState } from "react";
import { useReadingSettings, FontFamily, ThemeMode, themeStyles, VOICE_IDS, DEFAULT_VOICE_ID, BibleTranslation, TRANSLATION_LABELS } from "@/contexts/ReadingSettingsContext";

interface VoiceInfo {
  id: string;
  name: string;
  description?: string;
}


const fontOptions: { value: FontFamily; label: string; fontStack: string }[] = [
  { value: "Libre Baskerville", label: "Baskerville", fontStack: "'Libre Baskerville', serif" },
  { value: "Spectral", label: "Spectral", fontStack: "'Spectral', serif" },
  { value: "Source Sans 3", label: "Source", fontStack: "'Source Sans 3', sans-serif" },
  { value: "System", label: "System", fontStack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
];

export default function ReadingSettingsPanel() {
  const {
    settings,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setThemeMode,
    setVoiceId,
    setTranslation,
    isPanelOpen,
    closePanel,
  } = useReadingSettings();

  const [voices, setVoices] = useState<VoiceInfo[]>([]);

  // Fetch voice names once when panel opens
  useEffect(() => {
    if (isPanelOpen && voices.length === 0) {
      fetch("/api/voices")
        .then((r) => r.json())
        .then((data: VoiceInfo[]) => setVoices(data))
        .catch(() => {
          // Fallback: use IDs as labels
          setVoices(VOICE_IDS.map((id) => ({ id, name: id.slice(0, 8) })));
        });
    }
  }, [isPanelOpen, voices.length]);

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        closePanel();
      }
    }

    if (isPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isPanelOpen, closePanel]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    if (isPanelOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isPanelOpen, closePanel]);

  if (!isPanelOpen) return null;

  const currentTheme = themeStyles[settings.themeMode];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 transition-opacity"
        onClick={closePanel}
      />

      {/* Dropdown panel — anchored top-right below header */}
      <div
        ref={panelRef}
        className="fixed top-[52px] right-2 z-50 w-[300px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          backgroundColor: currentTheme.background,
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <div className="px-5 pt-5 pb-4 max-h-[calc(100vh-80px)] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <span
              className="text-[15px] font-semibold"
              style={{ color: currentTheme.text }}
            >
              Reading Settings
            </span>
            <button
              onClick={closePanel}
              className="w-7 h-7 rounded-full flex items-center justify-center active:opacity-70 transition-opacity"
              style={{ backgroundColor: currentTheme.card, color: currentTheme.secondary }}
              aria-label="Close settings"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Translation Selection */}
          <div className="mb-5">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: currentTheme.secondary }}
            >
              Translation
            </div>
            <div className="flex gap-2">
              {(["ct", "kjv"] as BibleTranslation[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTranslation(t)}
                  className="flex-1 px-3 py-2 rounded-xl text-[13px] font-medium transition-all text-center"
                  style={{
                    backgroundColor:
                      settings.translation === t
                        ? "var(--accent)"
                        : currentTheme.card,
                    color:
                      settings.translation === t
                        ? "#FFFFFF"
                        : currentTheme.text,
                    border: `1.5px solid ${
                      settings.translation === t
                        ? "var(--accent)"
                        : currentTheme.border
                    }`,
                  }}
                >
                  {TRANSLATION_LABELS[t].name}
                </button>
              ))}
            </div>
            {settings.translation === "ct" && TRANSLATION_LABELS.ct.auditStatus && (
              <p
                className="text-[11px] mt-1.5 text-center"
                style={{ color: currentTheme.secondary }}
              >
                {TRANSLATION_LABELS.ct.auditStatus} — being checked against the KJV for accuracy
              </p>
            )}
          </div>

          {/* Font Family Selection */}
          <div className="mb-5">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: currentTheme.secondary }}
            >
              Font
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {fontOptions.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setFontFamily(font.value)}
                  className="px-3 py-2 rounded-xl text-[13px] font-medium transition-all text-center"
                  style={{
                    fontFamily: font.fontStack,
                    backgroundColor:
                      settings.fontFamily === font.value
                        ? "var(--accent)"
                        : currentTheme.card,
                    color:
                      settings.fontFamily === font.value
                        ? "#FFFFFF"
                        : currentTheme.text,
                    border: `1.5px solid ${
                      settings.fontFamily === font.value
                        ? "var(--accent)"
                        : currentTheme.border
                    }`,
                  }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Size Slider */}
          <div className="mb-5">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: currentTheme.secondary }}
            >
              Text Size
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize(14)}
                className="text-[12px] font-medium active:opacity-60 transition-opacity"
                style={{ color: currentTheme.secondary }}
                aria-label="Minimum text size"
              >
                A
              </button>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={14}
                  max={28}
                  step={1}
                  value={settings.fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${currentTheme.secondary} 0%, ${currentTheme.secondary} ${((settings.fontSize - 14) / 14) * 100}%, ${currentTheme.border} ${((settings.fontSize - 14) / 14) * 100}%, ${currentTheme.border} 100%)`,
                  }}
                />
              </div>
              <button
                onClick={() => setFontSize(28)}
                className="text-[18px] font-medium active:opacity-60 transition-opacity"
                style={{ color: currentTheme.secondary }}
                aria-label="Maximum text size"
              >
                A
              </button>
            </div>
          </div>

          {/* Line Spacing Slider */}
          <div className="mb-5">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: currentTheme.secondary }}
            >
              Line Spacing
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLineHeight(1.4)}
                className="w-5 flex flex-col gap-[2px] active:opacity-60 transition-opacity"
                aria-label="Minimum line spacing"
              >
                <div className="h-[1.5px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "16px" }} />
                <div className="h-[1.5px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "16px" }} />
                <div className="h-[1.5px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "16px" }} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={1.4}
                  max={2.4}
                  step={0.1}
                  value={settings.lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${currentTheme.secondary} 0%, ${currentTheme.secondary} ${((settings.lineHeight - 1.4) / 1.0) * 100}%, ${currentTheme.border} ${((settings.lineHeight - 1.4) / 1.0) * 100}%, ${currentTheme.border} 100%)`,
                  }}
                />
              </div>
              <button
                onClick={() => setLineHeight(2.4)}
                className="w-5 flex flex-col gap-[4px] active:opacity-60 transition-opacity"
                aria-label="Maximum line spacing"
              >
                <div className="h-[1.5px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "16px" }} />
                <div className="h-[1.5px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "16px" }} />
                <div className="h-[1.5px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "16px" }} />
              </button>
            </div>
          </div>

          {/* Theme Mode Selection */}
          <div className="mb-5">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: currentTheme.secondary }}
            >
              Theme
            </div>
            <div className="flex gap-2">
              {/* Light */}
              <button
                onClick={() => setThemeMode("light")}
                className="flex-1 h-10 rounded-full border-2 transition-all flex items-center justify-center"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: settings.themeMode === "light" ? "var(--accent)" : "rgba(0,0,0,0.1)",
                }}
              >
                {settings.themeMode === "light" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              {/* Sepia */}
              <button
                onClick={() => setThemeMode("sepia")}
                className="flex-1 h-10 rounded-full border-2 transition-all flex items-center justify-center"
                style={{
                  backgroundColor: "#F8F1E3",
                  borderColor: settings.themeMode === "sepia" ? "var(--accent)" : "rgba(0,0,0,0.1)",
                }}
              >
                {settings.themeMode === "sepia" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              {/* Gray */}
              <button
                onClick={() => setThemeMode("gray")}
                className="flex-1 h-10 rounded-full border-2 transition-all flex items-center justify-center"
                style={{
                  backgroundColor: "#E8E8E8",
                  borderColor: settings.themeMode === "gray" ? "var(--accent)" : "rgba(0,0,0,0.1)",
                }}
              >
                {settings.themeMode === "gray" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              {/* Dark */}
              <button
                onClick={() => setThemeMode("dark")}
                className="flex-1 h-10 rounded-full border-2 transition-all flex items-center justify-center"
                style={{
                  backgroundColor: "#1a1a1a",
                  borderColor: settings.themeMode === "dark" ? "var(--accent)" : "rgba(255,255,255,0.2)",
                }}
              >
                {settings.themeMode === "dark" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Narrator Voice Selection */}
          {voices.length > 0 && (
            <div>
              <div
                className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: currentTheme.secondary }}
              >
                Narrator Voice
              </div>
              <div className="flex flex-col gap-1.5">
                {voices.map((voice) => {
                  const isSelected = settings.voiceId === voice.id;
                  return (
                    <button
                      key={voice.id}
                      onClick={() => setVoiceId(voice.id)}
                      className="w-full px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{
                        backgroundColor: isSelected
                          ? "var(--accent)"
                          : currentTheme.card,
                        border: `1.5px solid ${
                          isSelected ? "var(--accent)" : currentTheme.border
                        }`,
                      }}
                    >
                      <span
                        className="block text-[13px] font-semibold leading-tight"
                        style={{ color: isSelected ? "#FFFFFF" : currentTheme.text }}
                      >
                        {voice.name}
                      </span>
                      {voice.description && (
                        <span
                          className="block text-[11px] leading-tight mt-0.5"
                          style={{
                            color: isSelected
                              ? "rgba(255,255,255,0.75)"
                              : currentTheme.secondary,
                          }}
                        >
                          {voice.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom slider thumb styles */}
      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${currentTheme.secondary};
          cursor: pointer;
          border: 3px solid ${currentTheme.background};
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${currentTheme.secondary};
          cursor: pointer;
          border: 3px solid ${currentTheme.background};
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      `}</style>
    </>
  );
}
