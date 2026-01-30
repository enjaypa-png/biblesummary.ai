export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

interface PageProps {
  params: {
    book: string;
  };
}

interface Book {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  testament: string;
  total_chapters: number;
}

async function getBook(slug: string): Promise<Book | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("books")
    .select("id, name, slug, order_index, testament, total_chapters")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function BookChaptersPage({ params }: PageProps) {
  const book = await getBook(params.book);

  if (!book) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
          <div className="max-w-lg mx-auto flex items-center">
            <Link href="/bible" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
              Back
            </Link>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-5 py-16 text-center">
          <p style={{ color: "var(--secondary)" }}>Book not found.</p>
          <Link href="/bible" className="inline-block mt-4 text-sm font-medium" style={{ color: "var(--accent)" }}>
            Browse all books
          </Link>
        </main>
      </div>
    );
  }

  const chapters = Array.from({ length: book.total_chapters }, (_, i) => i + 1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/bible" title="Back to all books" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--accent)" }}>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Books
          </Link>
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>
            {book.name}
          </h1>
          <span className="text-sm w-[44px]" style={{ color: "var(--secondary)", textAlign: "right" }}>
            {book.total_chapters} ch
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 pb-8">
        {/* Chapter grid */}
        <div className="grid grid-cols-5 gap-2.5">
          {chapters.map((ch) => (
            <Link
              key={ch}
              href={`/bible/${book.slug}/${ch}`}
              title={`Read ${book.name} chapter ${ch}`}
              className="aspect-square rounded-xl flex items-center justify-center text-[15px] font-medium transition-all active:scale-95"
              style={{
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
                border: "0.5px solid var(--border)",
              }}
            >
              {ch}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: book } = await supabase
    .from("books")
    .select("name")
    .eq("slug", params.book)
    .single();

  const bookName = book ? book.name : params.book.charAt(0).toUpperCase() + params.book.slice(1);

  return {
    title: `${bookName} - BibleSummary.ai`,
    description: `Select a chapter from ${bookName} to read (KJV).`,
  };
}
