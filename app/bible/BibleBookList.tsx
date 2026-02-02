"use client";

import { useState } from "react";
import Link from "next/link";

interface Book {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  testament: string;
  total_chapters: number;
}

export default function BibleBookList({ books }: { books: Book[] }) {
  const [tab, setTab] = useState<"Old" | "New">("Old");

  const oldTestament = books.filter((b) => b.testament === "Old");
  const newTestament = books.filter((b) => b.testament === "New");
  const displayed = tab === "Old" ? oldTestament : newTestament;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}
      >
        <div className="max-w-lg mx-auto">
          <h1 
            className="font-semibold text-center py-3 smooth-transition"
            style={{ 
              color: "var(--foreground)",
              fontSize: "var(--text-lg)"
            }}
          >
            Bible
          </h1>

          {/* Testament toggle */}
          <div className="flex px-5 pb-2 gap-0">
            {(["Old", "New"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 pb-2.5 text-[14px] font-semibold tracking-wide relative smooth-transition modern-button"
                style={{ 
                  color: tab === t ? "var(--foreground)" : "var(--foreground-secondary)",
                  minHeight: "44px"
                }}
              >
                {t} Testament
                {tab === t && (
                  <span
                    className="absolute bottom-0 left-[15%] right-[15%] h-[2.5px] rounded-full"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pt-2 pb-6">
        <div className="mx-4">
          {displayed.map((book, i) => (
            <Link
              key={book.id}
              href={`/bible/${book.slug}`}
              title={`Read ${book.name} — ${book.total_chapters} chapters`}
              className="flex items-center justify-between px-3 py-[13px] smooth-transition modern-button"
              style={{
                borderBottom: i < displayed.length - 1 ? "0.5px solid var(--border)" : "none",
                minHeight: "44px"
              }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className="text-[11px] font-medium w-5 text-right tabular-nums"
                  style={{ color: "var(--border)" }}
                >
                  {book.order_index}
                </span>
                <span
                  className="truncate font-semibold"
                  style={{ 
                    color: "var(--foreground)",
                    fontSize: "var(--text-base)"
                  }}
                >
                  {book.name}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 flex-shrink-0 ml-2 px-3 py-1 rounded-full smooth-transition"
                style={{ 
                  backgroundColor: "var(--card)", 
                  border: "0.5px solid var(--border)",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <span className="text-[12px] font-medium tabular-nums" style={{ color: "var(--secondary)" }}>
                  {book.total_chapters} ch
                </span>
                <svg width="5" height="9" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
