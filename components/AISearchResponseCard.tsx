"use client";

interface Verse {
  reference: string;
  text: string;
}

interface AISearchResponseCardProps {
  question: string;
  answer: string;
  verses: Verse[];
  /** If true, blur the answer after the preview portion and show a CTA */
  blurred?: boolean;
  blurCta?: React.ReactNode;
  onVerseClick?: (reference: string) => void;
  onDismiss?: () => void;
}

export default function AISearchResponseCard({
  question,
  answer,
  verses,
  blurred = false,
  blurCta,
  onVerseClick,
  onDismiss,
}: AISearchResponseCardProps) {
  return (
    <div style={{ animation: "aiCardSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
      <style>{`
        @keyframes aiCardSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          borderRadius: 18,
          background: "var(--card, #fff)",
          border: "1px solid var(--border, rgba(0,0,0,0.08))",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent, #7c5cfc)">
              <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
            </svg>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent, #7c5cfc)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              AI Answer
            </span>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex items-center justify-center rounded-full active:opacity-60"
              style={{
                width: 28,
                height: 28,
                background: "var(--background, #f9fafb)",
                border: "1px solid var(--border, rgba(0,0,0,0.08))",
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--secondary, #888)" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Question */}
        <div style={{ padding: "12px 20px 0" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              background: "rgba(124, 92, 252, 0.06)",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--accent, #7c5cfc)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            &ldquo;{question}&rdquo;
          </div>
        </div>

        {/* Answer */}
        <div style={{ padding: "14px 20px 0", position: "relative" }}>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: "var(--foreground, #1a1a1a)",
              margin: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {answer}
          </p>

          {blurred && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
                background: "linear-gradient(to bottom, transparent, var(--card, #fff))",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Blur CTA */}
        {blurred && blurCta && (
          <div style={{ padding: "8px 20px 20px", textAlign: "center" }}>
            {blurCta}
          </div>
        )}

        {/* Verses */}
        {!blurred && verses.length > 0 && (
          <div style={{ padding: "14px 20px 20px" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--secondary, #9ca3af)",
                marginBottom: 10,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Supporting Verses
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {verses.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onVerseClick?.(v.reference)}
                  className="w-full text-left active:scale-[0.99] transition-all"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    backgroundColor: "var(--background, #f9fafb)",
                    border: "1px solid var(--border, rgba(0,0,0,0.08))",
                    cursor: onVerseClick ? "pointer" : "default",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--accent, #7c5cfc)",
                      marginBottom: 4,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {v.reference}
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      margin: 0,
                      color: "var(--foreground, #1a1a1a)",
                      lineHeight: 1.6,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {v.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No answer fallback */}
        {!blurred && !answer && verses.length === 0 && (
          <div style={{ padding: "16px 20px 20px", textAlign: "center" }}>
            <p
              style={{
                fontSize: 14,
                color: "var(--secondary, #9ca3af)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              No results found. Try rephrasing your question.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
