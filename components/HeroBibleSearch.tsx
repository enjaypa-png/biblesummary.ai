"use client";

import { useState } from "react";
import Link from "next/link";

const DEMO_QUESTION = "Who was Samson?";

const DEMO_ANSWER_SHORT =
  "Samson was a judge of Israel known for his incredible strength, which God gave him to help defend Israel from the Philistines. His strength was tied to a Nazirite vow, meaning his hair was never to be cut.\n\nSamson performed many powerful acts. In one famous story, he killed 1,000 Philistine soldiers using only the jawbone of a donkey (Judges 15:15). Despite his strength, Samson often made poor choices, especially in relationships. Delilah eventually betrayed him, and his enemies captured him after cutting his hair.";

const DEMO_ANSWER_MORE =
  "At the end of his life, Samson prayed for strength one last time. While chained inside a Philistine temple, he pushed apart the two central pillars, collapsing the building and killing the Philistine rulers and many others inside. The Bible says he killed more Philistines in his death than during his life (Judges 16:30).\n\nSamson\u2019s story is about strength, failure, and redemption\u2014showing that even after serious mistakes, turning back to God still matters.";

const DEMO_VERSES = [
  {
    reference: "Judges 13:24",
    text: "The woman gave birth to a son and named him Samson. The boy grew up, and the LORD blessed him.",
  },
  {
    reference: "Judges 14:6",
    text: "The Spirit of the LORD came powerfully upon him so that he tore the lion apart with his bare hands as he might have torn a young goat.",
  },
  {
    reference: "Judges 16:17",
    text: "So he told her everything. \u201CNo razor has ever been used on my head,\u201D he said, \u201Cbecause I have been a Nazirite dedicated to God from my mother\u2019s womb. If my head were shaved, my strength would leave me.\u201D",
  },
  {
    reference: "Judges 16:30",
    text: "Samson said, \u201CLet me die with the Philistines!\u201D Then he pushed with all his might, and down came the temple on the rulers and all the people in it.",
  },
];

export default function HeroBibleSearch() {
  const [showDemo, setShowDemo] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <div
      style={{
        margin: "0 auto 28px",
        maxWidth: 640,
        textAlign: "left",
      }}
    >
      {/* Search bar visual (triggers demo) */}
      <button
        type="button"
        onClick={() => setShowDemo(!showDemo)}
        style={{
          display: "flex",
          width: "100%",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          background: "#fff",
          borderRadius: 999,
          border: showDemo ? "1.5px solid #7c5cfc" : "1.5px solid #d9d0ff",
          boxShadow: "0 10px 30px rgba(18, 5, 65, 0.08)",
          padding: "4px 4px 4px 14px",
          cursor: "pointer",
          transition: "border-color 0.2s ease",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#7c5cfc",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
            <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
          </svg>
        </div>
        <span
          style={{
            flex: 1,
            padding: "12px 8px",
            fontSize: 15,
            fontFamily: "'DM Sans', sans-serif",
            color: showDemo ? "#2a2520" : "#9a958e",
          }}
        >
          {showDemo ? DEMO_QUESTION : "Ask ClearBible AI anything about the Bible"}
        </span>
        <span
          style={{
            padding: "10px 22px",
            borderRadius: 999,
            background: "linear-gradient(135deg, #7c5cfc 0%, #7c5cfc 100%)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            flexShrink: 0,
          }}
        >
          {showDemo ? "Hide" : "See example"}
        </span>
      </button>

      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          color: "#8a8580",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ marginBottom: 4 }}>
          Ask ClearBible&apos;s AI questions about the Bible and get instant, plain-language answers with supporting verses.
        </div>
      </div>

      {/* Demo answer card */}
      {showDemo && (
        <div
          style={{
            marginTop: 16,
            animation: "slideDown 0.35s ease",
          }}
        >
          {/* AI Answer */}
          <div
            style={{
              padding: "20px 22px",
              background: "linear-gradient(135deg, #f8f6ff 0%, #f0edff 100%)",
              borderRadius: 14,
              borderLeft: "3px solid #7c5cfc",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#7c5cfc">
                <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7c5cfc",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                AI Answer
              </span>
            </div>
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: "#4a4550",
                margin: 0,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {DEMO_ANSWER_SHORT.split("\n\n").map((para, i) => (
                <p key={i} style={{ margin: i === 0 ? 0 : "12px 0 0" }}>{para}</p>
              ))}
              {!showMore && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowMore(true); }}
                  style={{
                    display: "inline-block",
                    marginTop: 10,
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#7c5cfc",
                    background: "rgba(124, 92, 252, 0.08)",
                    border: "1px solid rgba(124, 92, 252, 0.2)",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  More
                </button>
              )}
              {showMore && DEMO_ANSWER_MORE.split("\n\n").map((para, i) => (
                <p key={`more-${i}`} style={{ margin: "12px 0 0" }}>{para}</p>
              ))}
            </div>
          </div>

          {/* Supporting verses */}
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "#fff",
              border: "1px solid #e8e5e0",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#8a8580",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: 10,
              }}
            >
              Supporting Verses
            </div>
            {DEMO_VERSES.map((v) => (
              <div
                key={v.reference}
                style={{
                  padding: "10px 10px 12px",
                  borderRadius: 10,
                  border: "1px solid #eee7dd",
                  background: "#fff",
                  marginBottom: 8,
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
                  {v.reference}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    margin: 0,
                    color: "#3a3530",
                    lineHeight: 1.6,
                  }}
                >
                  {v.text}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link
              href="/signup"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                color: "#fff",
                background: "linear-gradient(135deg, #7c5cfc 0%, #7c5cfc 100%)",
                borderRadius: 10,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(124,92,252,0.3)",
              }}
            >
              Create a free account to ask your own questions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
