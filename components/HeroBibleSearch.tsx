"use client";

import { useState, type FormEvent } from "react";

export default function HeroBibleSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/bible-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!res.ok) {
        throw new Error("Search failed");
      }
      const data = await res.json();
      setResults(Array.isArray(data.verses) ? data.verses : []);
    } catch (err) {
      console.error("[HeroBibleSearch] error:", err);
      setError("Search unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        margin: "0 auto 28px",
        maxWidth: 640,
        textAlign: "left",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "stretch",
          background: "#fff",
          borderRadius: 999,
          border: "1.5px solid #d9d0ff",
          boxShadow: "0 10px 30px rgba(18, 5, 65, 0.08)",
          padding: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            paddingLeft: 14,
            color: "#7c5cfc",
          }}
        >
          <span aria-hidden="true">🔍</span>
          <span aria-hidden="true">✨</span>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask ClearBible AI anything about the Bible"
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            padding: "12px 18px",
            fontSize: 15,
            borderRadius: 999,
            fontFamily: "'DM Sans', sans-serif",
            color: "#2a2520",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 22px",
            borderRadius: 999,
            border: "none",
            background: loading
              ? "linear-gradient(135deg, #a590ff 0%, #a590ff 100%)"
              : "linear-gradient(135deg, #7c5cfc 0%, #7c5cfc 100%)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: loading ? "default" : "pointer",
            flexShrink: 0,
          }}
        >
          {loading ? "Searching..." : "Search verses"}
        </button>
      </form>

      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          color: "#8a8580",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ marginBottom: 4 }}>
          Ask ClearBible’s AI questions about the Bible and instantly see the verses that answer them.
        </div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Why did Judas betray Jesus?</li>
          <li>What does the Bible say about anxiety?</li>
          <li>Why did God flood the earth?</li>
          <li>What is faith according to the Bible?</li>
        </ul>
      </div>

      {error && (
        <p
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "#c0392b",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #e8e5e0",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {results.map((v, idx) => {
            const ref =
              typeof v.book_reference === "string"
                ? v.book_reference
                : v.book_name
                ? `${v.book_name} ${v.chapter}:${v.verse}`
                : `Book ${v.book_id} ${v.chapter}:${v.verse}`;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const slug = v.book_slug || v.book_id;
                  window.location.href = `/bible/${encodeURIComponent(
                    slug
                  )}/${v.chapter}?verse=${v.verse}`;
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 10px 12px",
                  borderRadius: 10,
                  border: "1px solid #eee7dd",
                  background: "#fff",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#7c5cfc",
                    marginBottom: 4,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {ref}
                  {typeof v.similarity === "number" && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        color: "#b0a89e",
                      }}
                    >
                      {(v.similarity * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>
                {v.text && (
                  <p
                    style={{
                      fontSize: 13,
                      margin: "0 0 4px",
                      color: "#3a3530",
                    }}
                  >
                    {v.text}
                  </p>
                )}
                {v.modern_text && (
                  <p
                    style={{
                      fontSize: 13,
                      margin: 0,
                      color: "#6a655f",
                    }}
                  >
                    {v.modern_text}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

