export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

interface Book {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  testament: string;
  total_chapters: number;
}

async function getBooks(): Promise<Book[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("books")
    .select("id, name, slug, order_index, testament, total_chapters")
    .order("order_index");

  if (error || !data) return [];
  return data;
}

function BookList({ books, testament }: { books: Book[]; testament: string }) {
  return (
    <section className="mb-8">
      <div className="px-5 pb-1 pt-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
          {testament} Testament
        </h2>
      </div>
      <div className="bg-[var(--card)] rounded-xl mx-4 overflow-hidden"
        style={{ border: "0.5px solid var(--border)" }}>
        {books.map((book, i) => (
          <Link
            key={book.id}
            href={`/bible/${book.slug}/1`}
            className="flex items-center justify-between px-4 py-[12px] transition-colors active:bg-gray-100 dark:active:bg-gray-700/50"
            style={i < books.length - 1 ? { borderBottom: "0.5px solid var(--border)" } : {}}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: "var(--accent)" }}>
                {book.order_index}
              </div>
              <span className="text-[15px] font-normal" style={{ color: "var(--foreground)" }}>
                {book.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[13px]" style={{ color: "var(--secondary)" }}>
                {book.total_chapters}
              </span>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="ml-1">
                <path d="M1 1L6 6L1 11" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function BiblePage() {
  const books = await getBooks();

  const oldTestament = books.filter((b) => b.testament === "Old");
  const newTestament = books.filter((b) => b.testament === "New");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-md"
        style={{ backgroundColor: "rgba(242,242,247,0.85)", borderBottom: "0.5px solid var(--border)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-center">
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
            Bible
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto pt-4 pb-6">
        <BookList books={oldTestament} testament="Old" />
        <BookList books={newTestament} testament="New" />
      </main>
    </div>
  );
}

export const metadata = {
  title: "Bible - BibleSummary.ai",
  description: "Browse all 66 books of the Bible. Read the King James Version for free.",
};
