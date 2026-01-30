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
    <section className="mb-6">
      <div className="px-5 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--secondary)" }}>
          {testament} Testament
        </h2>
      </div>
      <div className="mx-4">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/bible/${book.slug}`}
            className="flex items-center justify-between px-3 py-[11px] transition-colors active:bg-black/5 dark:active:bg-white/5 rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[11px] font-semibold w-5 text-right tabular-nums" style={{ color: "var(--secondary)" }}>
                {book.order_index}
              </span>
              <span className="text-[15px] font-normal truncate" style={{ color: "var(--foreground)" }}>
                {book.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className="text-[12px] tabular-nums" style={{ color: "var(--secondary)" }}>
                {book.total_chapters} ch
              </span>
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path d="M1 1L5 5L1 9" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
      <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-center">
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
            Bible
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto pt-3 pb-6">
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
