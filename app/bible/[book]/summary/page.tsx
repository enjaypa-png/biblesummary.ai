export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import SummaryClient from "./SummaryClient";
import Link from "next/link";

interface PageProps {
  params: {
    book: string;
  };
}

async function getSummaryData(bookSlug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, name, slug, total_chapters")
    .eq("slug", bookSlug)
    .single();

  if (bookError || !book) {
    return { book: null, summaryText: null };
  }

  const { data: summary } = await supabase
    .from("summaries")
    .select("summary_text")
    .eq("book_id", book.id)
    .single();

  return { book, summaryText: summary?.summary_text || null };
}

export default async function SummaryPage({ params }: PageProps) {
  const { book, summaryText } = await getSummaryData(params.book);

  if (!book) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
          <div className="max-w-2xl mx-auto flex items-center">
            <Link href="/bible" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
              Back
            </Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 text-center">
          <p style={{ color: "var(--secondary)" }}>Book not found.</p>
          <Link href="/bible" className="inline-block mt-4 text-sm font-medium" style={{ color: "var(--accent)" }}>
            Browse all books
          </Link>
        </main>
      </div>
    );
  }

  return (
    <SummaryClient
      bookName={book.name}
      bookSlug={book.slug}
      bookId={book.id}
      summaryText={summaryText}
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

  const bookName = book ? book.name : params.book.charAt(0).toUpperCase() + params.book.slice(1);

  return {
    title: `${bookName} Summary - ClearBible.ai`,
    description: `Summary of the book of ${bookName} from the King James Bible.`,
  };
}
