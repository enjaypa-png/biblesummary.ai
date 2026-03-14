"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";

// ---------------------------------------------------------------------------
// Bible-relevance pre-check (client-side, no API call)
// ---------------------------------------------------------------------------

const GREETINGS = new Set([
  "hi", "hello", "hey", "howdy", "sup", "yo", "hola", "greetings",
  "good morning", "good afternoon", "good evening", "good night",
  "whats up", "what's up", "how are you", "how r u",
]);

const BIBLE_KEYWORDS = [
  // books (abbreviated)
  "genesis", "exodus", "leviticus", "numbers", "deuteronomy",
  "joshua", "judges", "ruth", "samuel", "kings", "chronicles",
  "ezra", "nehemiah", "esther", "job", "psalm", "psalms", "proverbs",
  "ecclesiastes", "solomon", "isaiah", "jeremiah", "lamentations",
  "ezekiel", "daniel", "hosea", "joel", "amos", "obadiah", "jonah",
  "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah",
  "malachi", "matthew", "mark", "luke", "john", "acts", "romans",
  "corinthians", "galatians", "ephesians", "philippians", "colossians",
  "thessalonians", "timothy", "titus", "philemon", "hebrews", "james",
  "peter", "jude", "revelation",
  // core topics
  "bible", "scripture", "verse", "god", "jesus", "christ", "lord",
  "holy spirit", "heaven", "hell", "sin", "grace", "faith", "prayer",
  "pray", "church", "gospel", "salvation", "baptism", "resurrection",
  "angel", "demon", "satan", "devil", "prophet", "apostle", "disciple",
  "commandment", "covenant", "creation", "crucifixion", "cross",
  "eden", "noah", "abraham", "moses", "david", "solomon", "paul",
  "mary", "joseph", "adam", "eve", "israel", "jerusalem", "pharaoh",
  "exodus", "passover", "pentecost", "sabbath", "temple", "tabernacle",
  "ark", "flood", "miracle", "parable", "sermon", "mount", "beatitudes",
  "tithe", "offering", "worship", "praise", "forgiveness", "repent",
  "repentance", "atonement", "righteousness", "holy", "sacred",
  "blessing", "blessed", "eternal", "soul", "spirit", "spiritual",
  "testament", "old testament", "new testament", "theological",
  "theology", "doctrine", "trinity", "omnipotent", "omniscient",
  "redemption", "lamb", "shepherd", "vineyard", "prodigal",
  "promised land", "ten commandments", "golden rule", "psalter",
  "epistle", "revelation", "apocalypse", "rapture", "messiah",
  "anoint", "anointed", "pharisee", "sadducee", "levite",
  "priest", "king", "queen", "tribe", "twelve tribes",
];

const NON_BIBLE_RE =
  /\b(password|hack|credit card|social security|ssn|bitcoin|crypto|stock market|recipe|weather|score|nfl|nba|mlb|fifa|concert|movie|netflix|tiktok|instagram|snapchat|facebook|twitter)\b/i;

/**
 * Quick client-side check: is the query plausibly about the Bible?
 * Returns `true` if the query should be sent to the API.
 */
export function isBibleRelevant(raw: string): boolean {
  const q = raw.trim().toLowerCase().replace(/['']/g, "'");

  // Too short to be meaningful
  if (q.length < 2) return false;

  // Pure greeting
  if (GREETINGS.has(q)) return false;

  // Obvious non-Bible topic
  if (NON_BIBLE_RE.test(q)) return false;

  // Contains a Bible keyword → allow
  for (const kw of BIBLE_KEYWORDS) {
    if (q.includes(kw)) return true;
  }

  // Looks like a verse reference (e.g. "3:16", "John 3")
  if (/\d+:\d+/.test(q)) return true;

  // Question with 4+ words — give benefit of the doubt
  if (q.split(/\s+/).length >= 4) return true;

  // 2-3 words with no Bible signal — still allow (could be "love thy neighbor")
  if (q.split(/\s+/).length >= 2) return true;

  // Single non-keyword word
  return false;
}

export const NOT_BIBLE_MESSAGE =
  "This question doesn't appear to be about the Bible. Try asking about a Bible verse, person, event, or teaching.";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
            outline: none !important;
            color: var(--foreground, #2a2520);
            white-space: nowrap;
            overflow-x: auto;
            overflow-y: hidden;
            text-overflow: clip;
            -webkit-user-select: text;
            user-select: text;
          }
          .ai-search-bar-input:focus,
          .ai-search-bar-input:focus-visible {
            outline: none !important;
            box-shadow: none !important;
            border: none !important;
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
