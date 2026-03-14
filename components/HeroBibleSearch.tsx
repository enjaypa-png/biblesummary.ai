"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import AISearchModal from "@/components/AISearchModal";

const SUGGESTION_CHIPS = [
  "Who was Moses?",
  "What is grace?",
  "Explain John 3:16",
];

const STATS = [
  { label: "Verses", value: "31,102" },
  { label: "Books", value: "66" },
  { label: "Chapters", value: "1,189" },
];

export default function HeroBibleSearch() {
  const [inputValue, setInputValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalQuery, setModalQuery] = useState("");
  const [shakeInput, setShakeInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      // Trigger shake animation on empty input
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      inputRef.current?.focus();
      return;
    }
    setModalQuery(trimmed);
    setShowModal(true);
  }

  function handleChipClick(question: string) {
    setInputValue(question);
    setModalQuery(question);
    setShowModal(true);
  }

  return (
    <>
      <style>{`
        @keyframes floatChip0 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatChip1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatChip2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(124, 92, 252, 0.15), 0 0 60px rgba(124, 92, 252, 0.08), 0 10px 40px rgba(18, 5, 65, 0.12); }
          50% { box-shadow: 0 0 30px rgba(124, 92, 252, 0.25), 0 0 80px rgba(124, 92, 252, 0.12), 0 10px 40px rgba(18, 5, 65, 0.12); }
        }
        @keyframes pulseGlowFocused {
          0%, 100% { box-shadow: 0 0 25px rgba(124, 92, 252, 0.3), 0 0 70px rgba(124, 92, 252, 0.15), 0 10px 40px rgba(18, 5, 65, 0.15); }
          50% { box-shadow: 0 0 40px rgba(124, 92, 252, 0.4), 0 0 90px rgba(124, 92, 252, 0.2), 0 10px 40px rgba(18, 5, 65, 0.15); }
        }
        @keyframes shakeInput {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .hero-search-layout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
        }
        .hero-search-center {
          flex: 0 1 640px;
          min-width: 0;
          text-align: left;
        }
        .hero-search-side {
          flex: 0 0 180px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hero-search-side-left {
          align-items: flex-end;
          padding-top: 10px;
        }
        .hero-search-side-right {
          align-items: flex-start;
          padding-top: 10px;
        }
        .hero-suggestion-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(124, 92, 252, 0.15);
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          color: #5a4a8a;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
        .hero-suggestion-chip:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(124, 92, 252, 0.4);
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 16px rgba(124, 92, 252, 0.15);
        }
        .hero-stats-card {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(124, 92, 252, 0.12);
          border-radius: 20px;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 160px;
        }
        .hero-stats-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #7c5cfc;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
        .hero-stat-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .hero-stat-value {
          font-size: 20px;
          font-weight: 800;
          color: #1a1528;
          letter-spacing: -0.02em;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
        .hero-stat-label {
          font-size: 12px;
          font-weight: 500;
          color: #8a8a9a;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
        .hero-search-container {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(124, 92, 252, 0.1);
          border-radius: 28px;
          padding: 20px 24px;
        }
        .hero-ai-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 14px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #9b82fc;
          font-family: 'Inter', 'DM Sans', sans-serif;
        }
        .hero-search-bar {
          display: flex;
          width: 100%;
          gap: 0;
          align-items: center;
          background: linear-gradient(135deg, #fdfcff 0%, #f8f5ff 100%);
          border-radius: 50px;
          border: 2px solid transparent;
          background-clip: padding-box;
          position: relative;
          padding: 5px 5px 5px 20px;
          transition: all 0.3s ease;
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .hero-search-bar::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 52px;
          background: linear-gradient(135deg, #7c5cfc, #a78bfa, #c4b5fd, #7c5cfc);
          z-index: -1;
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }
        .hero-search-bar:hover::before {
          opacity: 1;
        }
        .hero-search-bar:hover {
          animation: pulseGlowFocused 2s ease-in-out infinite;
        }
        .hero-search-bar:focus-within::before {
          opacity: 1;
        }
        .hero-search-bar:focus-within {
          animation: pulseGlowFocused 2s ease-in-out infinite;
        }
        .hero-search-bar.shake {
          animation: shakeInput 0.5s ease-in-out;
        }
        .hero-sparkle-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          color: #7c5cfc;
        }
        .hero-search-input {
          flex: 1;
          padding: 14px 12px;
          font-size: 15px;
          font-weight: 400;
          font-family: 'Inter', 'DM Sans', sans-serif;
          background: transparent;
          border: none;
          outline: none;
          color: #2a2520;
        }
        .hero-search-input::placeholder {
          color: #a09aaf;
          font-style: italic;
        }
        .hero-ask-btn {
          padding: 12px 28px;
          border-radius: 50px;
          background: linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Inter', 'DM Sans', sans-serif;
          flex-shrink: 0;
          border: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(124, 92, 252, 0.35);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hero-ask-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 24px rgba(124, 92, 252, 0.45);
          background: linear-gradient(135deg, #8b6dff 0%, #6344e0 100%);
        }
        .hero-search-subtitle {
          margin-top: 10px;
          font-size: 13px;
          color: #8a85a0;
          font-family: 'Inter', 'DM Sans', sans-serif;
          text-align: center;
        }
        @media (max-width: 900px) {
          .hero-search-side {
            display: none !important;
          }
          .hero-search-layout {
            gap: 0;
          }
        }
      `}</style>

      <div className="hero-search-layout">
        {/* Left side: floating suggestion chips */}
        <div className="hero-search-side hero-search-side-left">
          {SUGGESTION_CHIPS.map((chip, i) => (
            <button
              key={chip}
              type="button"
              className="hero-suggestion-chip"
              style={{
                animation: `floatChip${i} ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
              onClick={() => handleChipClick(chip)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              {chip}
            </button>
          ))}
        </div>

        {/* Center: search bar */}
        <div className="hero-search-center">
          <div className="hero-search-container">
            <div className="hero-ai-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#9b82fc">
                <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
              </svg>
              AI-Powered Bible Search
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              className={`hero-search-bar ${shakeInput ? "shake" : ""}`}
            >
              <span className="hero-sparkle-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={shakeInput ? "Type a question first\u2026" : "Ask anything about the Bible..."}
                className="hero-search-input"
              />
              <button type="submit" className="hero-ask-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.912 5.813L20 10.125l-4.85 3.987L16.888 20 12 16.65 7.112 20l1.738-5.875L4 10.125l6.088-1.312z" />
                </svg>
                Ask AI
              </button>
            </form>

            <div className="hero-search-subtitle">
              Get instant Bible answers with supporting verses.
            </div>
          </div>
        </div>

        {/* Right side: Quick Stats card */}
        <div className="hero-search-side hero-search-side-right">
          <div className="hero-stats-card">
            <div className="hero-stats-title">The Bible</div>
            {STATS.map((stat) => (
              <div key={stat.label} className="hero-stat-row">
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Search Modal */}
      <AISearchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialQuery={modalQuery}
        onSelectVerse={(slug, chapter, verse) => {
          setShowModal(false);
          window.location.href = `/bible/${slug}/${chapter}?verse=${verse}`;
        }}
      />
    </>
  );
}
