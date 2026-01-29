import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

interface PageProps {
  params: {
    book: string;
    chapter: string;
  };
}

interface Verse {
  id: string;
  verse: number;
  text: string;
}

interface Book {
  id: string;
  name: string;
  slug: string;
  total_chapters: number;
}

async function getBibleData(bookSlug: string, chapterNum: number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, name, slug, total_chapters")
    .eq("slug", bookSlug)
    .single();

  if (bookError || !book) {
    return { book: null, verses: [], error: "Book not found" };
  }

  const { data: verses, error: versesError } = await supabase
    .from("verses")
    .select("id, verse, text")
    .eq("book_id", book.id)
    .eq("chapter", chapterNum)
    .order("verse");

  if (versesError) {
    return { book, verses: [], error: "Verses not found" };
  }

  return { book, verses: verses || [], error: null };
}

export default async function BibleChapterPage({ params }: PageProps) {
  const currentChapter = parseInt(params.chapter);
  const { book, verses, error } = await getBibleData(params.book, currentChapter);

  const prevChapter = currentChapter > 1 ? currentChapter - 1 : null;
  const nextChapter =
    book && currentChapter < book.total_chapters ? currentChapter + 1 : null;
  const bookName =
    book
      ? book.name
      : params.book.charAt(0).toUpperCase() + params.book.slice(1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header - current location, tappable */}
      <header
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-md"
        style={{
          backgroundColor: "rgba(242,242,247,0.85)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link
            href="/bible"
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Books
          </Link>
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {bookName} {params.chapter}
          </h1>
          <span className="text-sm" style={{ color: "var(--secondary)" }}>
            KJV
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Error state */}
        {error ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ color: "var(--foreground)" }}>
              {error === "Book not found"
                ? `The book "${params.book}" was not found.`
                : "No verses found for this chapter."}
            </p>
            <Link
              href="/bible"
              className="inline-block mt-4 text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              Browse all books
            </Link>
          </div>
        ) : (
          /* Bible text */
          <div className="bible-text rounded-xl p-5" style={{ color: "var(--foreground)", backgroundColor: "var(--card)" }}>
            {verses.map((verse: Verse) => (
              <span key={verse.id}>
                <sup className="verse-number">{verse.verse}</sup>
                {verse.text}{" "}
              </span>
            ))}
          </div>
        )}

        {/* Chapter navigation */}
        <div
          className="flex justify-between items-center mt-12 pt-6 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          {prevChapter ? (
            <Link
              href={`/bible/${params.book}/${prevChapter}`}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: "var(--foreground)",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              Chapter {prevChapter}
            </Link>
          ) : (
            <div />
          )}

          {nextChapter ? (
            <Link
              href={`/bible/${params.book}/${nextChapter}`}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Chapter {nextChapter}
            </Link>
          ) : (
            <Link
              href="/bible"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--accent)" }}
            >
              All Books
            </Link>
          )}
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

  const bookName =
    book
      ? book.name
      : params.book.charAt(0).toUpperCase() + params.book.slice(1);

  return {
    title: `${bookName} ${params.chapter} - BibleSummary.ai`,
    description: `Read ${bookName} chapter ${params.chapter} (KJV) - BibleSummary.ai`,
  };
}
