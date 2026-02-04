"use client";

import { useEffect, useRef } from "react";
import { useReadingSettings, FontFamily, ThemeMode, themeStyles } from "@/contexts/ReadingSettingsContext";

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
    isPanelOpen,
    closePanel,
  } = useReadingSettings();

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

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out"
        style={{
          backgroundColor: currentTheme.background,
          transform: isPanelOpen ? "translateY(0)" : "translateY(100%)",
          paddingBottom: "env(safe-area-inset-bottom, 20px)",
        }}
      >
        <div className="px-6 pt-6 pb-4">
          {/* Handle bar */}
          <div className="flex justify-center mb-6">
            <div
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: currentTheme.border }}
            />
          </div>

          {/* Font Family Selection */}
          <div className="flex justify-between items-center mb-8">
            {fontOptions.map((font) => (
              <button
                key={font.value}
                onClick={() => setFontFamily(font.value)}
                className="px-2 py-1 text-[15px] font-medium transition-colors"
                style={{
                  fontFamily: font.fontStack,
                  color: settings.fontFamily === font.value
                    ? "#c4a574"
                    : currentTheme.secondary,
                }}
              >
                {font.label}
              </button>
            ))}
          </div>

          {/* Text Size Slider */}
          <div className="flex items-center gap-4 mb-6">
            <span
              className="text-[14px] font-medium w-8"
              style={{ color: currentTheme.secondary }}
            >
              Aa<sup style={{ fontSize: "8px" }}>−</sup>
            </span>
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
            <span
              className="text-[18px] font-medium w-8 text-right"
              style={{ color: currentTheme.secondary }}
            >
              Aa<sup style={{ fontSize: "10px" }}>+</sup>
            </span>
          </div>

          {/* Line Spacing Slider */}
          <div className="flex items-center gap-4 mb-8">
            {/* Compact lines icon - tap to jump to minimum */}
            <button
              onClick={() => setLineHeight(1.4)}
              className="w-8 flex flex-col gap-[2px] p-1 -m-1 rounded active:opacity-60 transition-opacity"
              aria-label="Minimum line spacing"
            >
              <div className="h-[2px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "20px" }} />
              <div className="h-[2px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "20px" }} />
              <div className="h-[2px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "20px" }} />
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
            {/* Expanded lines icon - tap to jump to maximum */}
            <button
              onClick={() => setLineHeight(2.4)}
              className="w-8 flex flex-col gap-[5px] items-end p-1 -m-1 rounded active:opacity-60 transition-opacity"
              aria-label="Maximum line spacing"
            >
              <div className="h-[2px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "20px" }} />
              <div className="h-[2px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "20px" }} />
              <div className="h-[2px] rounded-full" style={{ backgroundColor: currentTheme.secondary, width: "20px" }} />
            </button>
          </div>

          {/* Theme Mode Selection */}
          <div className="flex justify-between gap-3 mb-6">
            {/* Light */}
            <button
              onClick={() => setThemeMode("light")}
              className="flex-1 h-12 rounded-full border-2 transition-all flex items-center justify-center"
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: settings.themeMode === "light" ? "#c4a574" : "rgba(0,0,0,0.1)",
              }}
            >
              {settings.themeMode === "light" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4a574" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Sepia */}
            <button
              onClick={() => setThemeMode("sepia")}
              className="flex-1 h-12 rounded-full border-2 transition-all flex items-center justify-center"
              style={{
                backgroundColor: "#F8F1E3",
                borderColor: settings.themeMode === "sepia" ? "#c4a574" : "rgba(0,0,0,0.1)",
              }}
            >
              {settings.themeMode === "sepia" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4a574" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Gray */}
            <button
              onClick={() => setThemeMode("gray")}
              className="flex-1 h-12 rounded-full border-2 transition-all flex items-center justify-center"
              style={{
                backgroundColor: "#E8E8E8",
                borderColor: settings.themeMode === "gray" ? "#c4a574" : "rgba(0,0,0,0.1)",
              }}
            >
              {settings.themeMode === "gray" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4a574" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Dark */}
            <button
              onClick={() => setThemeMode("dark")}
              className="flex-1 h-12 rounded-full border-2 transition-all flex items-center justify-center"
              style={{
                backgroundColor: "#1a1a1a",
                borderColor: settings.themeMode === "dark" ? "#c4a574" : "rgba(255,255,255,0.2)",
              }}
            >
              {settings.themeMode === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4a574" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={closePanel}
              className="p-3 rounded-full transition-colors"
              style={{ color: currentTheme.secondary }}
              aria-label="Close settings"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Custom slider thumb styles */}
      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${currentTheme.secondary};
          cursor: pointer;
          border: 3px solid ${currentTheme.background};
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
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
