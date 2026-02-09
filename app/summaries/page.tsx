import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

interface BookWithSummary {
  id: string;
  name: string;
  slug: string;
  testament: string;
  order_index: number;
}

async function getBooksWithSummaries(): Promise<BookWithSummary[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("summaries")
    .select("book_id, books(id, name, slug, testament, order_index)");

  if (error) return [];

  const books: BookWithSummary[] = [];
  for (const row of data || []) {
    const booksData = (row as { books: BookWithSummary | BookWithSummary[] | null }).books;
    const book = Array.isArray(booksData) ? booksData[0] : booksData;
    if (book) books.push(book);
  }
  return books.sort((a, b) => a.order_index - b.order_index);
}

export default async function SummariesLibraryPage() {
  const books = await getBooksWithSummaries();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--background-blur)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <h1
          className="text-[17px] font-semibold text-center max-w-lg mx-auto"
          style={{ color: "var(--foreground)" }}
        >
          Book Summaries
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-5 py-6">
        <p
          className="text-[14px] leading-relaxed mb-6"
          style={{ color: "var(--secondary)" }}
        >
          Neutral, descriptive summaries for each book. Understand what each book
          contains before or while you read — no interpretation or theology.
        </p>

        {books.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "var(--card)",
              border: "0.5px solid var(--border)",
            }}
          >
            <p
              className="text-[14px]"
              style={{ color: "var(--secondary)" }}
            >
              No summaries available yet. Check back soon.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: "var(--card)",
              border: "0.5px solid var(--border)",
            }}
          >
            {books.map((book, i) => (
              <Link
                key={book.id}
                href={`/summaries/${book.slug}`}
                className={`flex items-center justify-between px-4 py-3 transition-colors active:bg-black/5 dark:active:bg-white/5 ${
                  i < books.length - 1 ? "border-b" : ""
                }`}
                style={{
                  borderColor: "var(--border)",
                }}
              >
                <span
                  className="font-medium text-[15px]"
                  style={{ color: "var(--foreground)" }}
                >
                  {book.name}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: "var(--secondary)" }}
                >
                  {book.testament}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export const metadata = {
  title: "Book Summaries - BibleSummary.ai",
  description: "Neutral book summaries for every book of the Bible.",
};
