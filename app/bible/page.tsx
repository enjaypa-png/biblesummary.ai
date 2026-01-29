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

export default async function BiblePage() {
  const books = await getBooks();

  const oldTestament = books.filter((b) => b.testament === "Old");
  const newTestament = books.filter((b) => b.testament === "New");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b px-4 py-3"
        style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <h1 className="text-xl font-semibold text-center" style={{ color: "var(--foreground)" }}>
          Bible
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Old Testament */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--secondary)" }}>
            Old Testament
          </h2>
          <div className="space-y-1">
            {oldTestament.map((book) => (
              <Link
                key={book.id}
                href={`/bible/${book.slug}/1`}
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span className="font-medium" style={{ color: "var(--foreground)" }}>
                  {book.name}
                </span>
                <span className="text-sm" style={{ color: "var(--secondary)" }}>
                  {book.total_chapters} ch
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* New Testament */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--secondary)" }}>
            New Testament
          </h2>
          <div className="space-y-1">
            {newTestament.map((book) => (
              <Link
                key={book.id}
                href={`/bible/${book.slug}/1`}
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span className="font-medium" style={{ color: "var(--foreground)" }}>
                  {book.name}
                </span>
                <span className="text-sm" style={{ color: "var(--secondary)" }}>
                  {book.total_chapters} ch
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export const metadata = {
  title: "Bible - BibleSummary.ai",
  description: "Browse all 66 books of the Bible. Read the King James Version for free.",
};
