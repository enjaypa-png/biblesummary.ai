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
      <div className="px-5 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--secondary)" }}>
          {testament} Testament
        </h2>
      </div>
      <div className="bg-[var(--card)] rounded-2xl mx-4 overflow-hidden shadow-sm"
        style={{ border: "1px solid var(--border)" }}>
        {books.map((book, i) => (
          <Link
            key={book.id}
            href={`/bible/${book.slug}/1`}
            className="flex items-center justify-between px-4 py-[14px] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700/50"
            style={i < books.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
          >
            <span className="text-[15px] font-medium" style={{ color: "var(--foreground)" }}>
              {book.name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ color: "var(--secondary)", backgroundColor: "var(--background)" }}>
              {book.total_chapters} {book.total_chapters === 1 ? "chapter" : "chapters"}
            </span>
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
        style={{ backgroundColor: "rgba(255,255,255,0.85)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-center">
          <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
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
