import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SummaryViewClient from "./SummaryViewClient";

interface PageProps {
  params: { book: string };
}

async function getBookAndSummary(bookSlug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, name, slug")
    .eq("slug", bookSlug)
    .single();

  if (bookError || !book) return { book: null, summary: null };

  const { data: summary, error: summaryError } = await supabase
    .from("summaries")
    .select("summary_text")
    .eq("book_id", book.id)
    .single();

  if (summaryError || !summary) return { book, summary: null };

  return { book, summary: summary.summary_text };
}

export default async function SummaryPage({ params }: PageProps) {
  const { book, summary } = await getBookAndSummary(params.book);

  if (!book) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{
            backgroundColor: "var(--background-blur)",
            borderBottom: "0.5px solid var(--border)",
          }}
        >
          <Link
            href="/summaries"
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            ← Summaries
          </Link>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 text-center">
          <p style={{ color: "var(--foreground)" }}>Book not found.</p>
        </main>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header
          className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{
            backgroundColor: "var(--background-blur)",
            borderBottom: "0.5px solid var(--border)",
          }}
        >
          <Link
            href="/summaries"
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            ← Summaries
          </Link>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 text-center">
          <p style={{ color: "var(--secondary)" }}>
            No summary available for {book.name} yet.
          </p>
          <Link
            href="/summaries"
            className="inline-block mt-4 text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Browse other summaries
          </Link>
        </main>
      </div>
    );
  }

  return (
    <SummaryViewClient
      bookId={book.id}
      bookName={book.name}
      bookSlug={book.slug}
      summaryText={summary}
    />
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

  const bookName = book?.name || params.book;

  return {
    title: `${bookName} Summary - ClearBible.ai`,
    description: `Book summary for ${bookName}`,
  };
}
