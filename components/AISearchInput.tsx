"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";

interface AISearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  placeholder?: string;
  /** Show the "AI-Powered Bible Search" label above the bar */
  showLabel?: boolean;
}

export interface AISearchInputRef {
  focus: () => void;
}

const AISearchInput = forwardRef<AISearchInputRef, AISearchInputProps>(
  function AISearchInput(
    { value, onChange, onSubmit, loading = false, placeholder = "Ask anything about the Bible...", showLabel = false },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!loading && value.trim()) onSubmit();
    }

    return (
      <div>
        <style>{`
          @keyframes aiSearchPulse {
            0%, 100% { box-shadow: 0 0 12px rgba(124, 92, 252, 0.1), 0 2px 12px rgba(124, 92, 252, 0.08); }
            50% { box-shadow: 0 0 20px rgba(124, 92, 252, 0.18), 0 2px 12px rgba(124, 92, 252, 0.12); }
          }
          @keyframes aiSearchPulseFocused {
            0%, 100% { box-shadow: 0 0 16px rgba(124, 92, 252, 0.2), 0 2px 14px rgba(124, 92, 252, 0.14); }
            50% { box-shadow: 0 0 28px rgba(124, 92, 252, 0.3), 0 2px 14px rgba(124, 92, 252, 0.18); }
          }
          @keyframes aiSearchSpin {
            to { transform: rotate(360deg); }
          }
          .ai-search-bar-wrap {
            position: relative;
            border-radius: 50px;
            padding: 2px;
            background: linear-gradient(135deg, #7c5cfc, #a78bfa, #c4b5fd, #7c5cfc);
            animation: aiSearchPulse 3s ease-in-out infinite;
            transition: all 0.3s ease;
          }
          .ai-search-bar-wrap:focus-within {
            animation: aiSearchPulseFocused 2s ease-in-out infinite;
          }
          .ai-search-bar-inner {
            display: flex;
            align-items: center;
            width: 100%;
            border-radius: 48px;
            padding: 4px 4px 4px 16px;
            background: var(--card, #fff);
          }
          .ai-search-bar-input {
            flex: 1;
            min-width: 0;
            padding: 12px 12px;
            font-size: 15px;
            font-weight: 400;
            font-family: 'Inter', 'DM Sans', sans-serif;
            background: transparent;
            border: none;
            outline: none;
            color: var(--foreground, #2a2520);
          }
          .ai-search-bar-input::placeholder {
            color: var(--secondary, #a09aaf);
            font-style: italic;
          }
          .ai-search-bar-btn {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 22px;
            border-radius: 50px;
            background: linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%);
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            font-family: 'Inter', 'DM Sans', sans-serif;
            border: none;
            cursor: pointer;
            transition: all 0.25s ease;
            box-shadow: 0 2px 10px rgba(124, 92, 252, 0.3);
          }
          .ai-search-bar-btn:hover:not(:disabled) {
            transform: scale(1.03);
            box-shadow: 0 4px 16px rgba(124, 92, 252, 0.4);
          }
          .ai-search-bar-btn:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }
        `}</style>

        {showLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              marginBottom: 10,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--accent, #9b82fc)",
              fontFamily: "'Inter', 'DM Sans', sans-serif",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
            </svg>
            AI-Powered Bible Search
          </div>
        )}

        <form onSubmit={handleSubmit} className="ai-search-bar-wrap">
          <div className="ai-search-bar-inner">
            <span className="flex-shrink-0 flex items-center" style={{ color: "var(--accent, #7c5cfc)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
              </svg>
            </span>

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="ai-search-bar-input"
            />

            {value.trim() && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex-shrink-0 p-1.5 mr-1 rounded-full active:opacity-70"
                style={{ color: "var(--secondary, #888)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="ai-search-bar-btn"
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "aiSearchSpin 0.7s linear infinite",
                    }}
                  />
                  Thinking...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
                  </svg>
                  Ask AI
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }
);

export default AISearchInput;
