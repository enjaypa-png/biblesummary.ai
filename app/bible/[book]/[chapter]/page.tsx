import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ChapterReaderClient from "./ChapterReaderClient";

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
  translation?: string;
}

interface Book {
  id: string;
  name: string;
  slug: string;
  total_chapters: number;
}

async function getBibleData(bookSlug: string, chapterNum: number, translation: string = "ct") {
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

  // Fetch verses for the requested translation
  const { data: verses, error: versesError } = await supabase
    .from("verses")
    .select("id, verse, text")
    .eq("book_id", book.id)
    .eq("chapter", chapterNum)
    .eq("translation", translation)
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
  const nextChapter = book && currentChapter < book.total_chapters ? currentChapter + 1 : null;
  const bookName = book ? book.name : params.book.charAt(0).toUpperCase() + params.book.slice(1);

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
          style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/bible" className="text-sm font-medium" style={{ color: "var(--accent)" }}>Books</Link>
            <h1 className="text-[17px] font-semibold" style={{ color: "var(--foreground)" }}>Error</h1>
            <span className="w-[44px]" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-16 text-center">
          <p style={{ color: "var(--foreground)" }}>
            {error === "Book not found" ? `The book "${params.book}" was not found.` : "No verses found for this chapter."}
          </p>
          <Link href="/bible" className="inline-block mt-4 text-sm font-medium" style={{ color: "var(--accent)" }}>
            Browse all books
          </Link>
        </main>
      </div>
    );
  }

  return (
    <ChapterReaderClient
      bookName={bookName}
      bookSlug={params.book}
      bookId={book?.id || ""}
      chapter={currentChapter}
      totalChapters={book?.total_chapters || 1}
      verses={verses}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
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
    title: `${bookName} ${params.chapter} - ClearBible.ai`,
    description: `Read ${bookName} chapter ${params.chapter} in King James Version or Clear Bible Translation — ClearBible.ai`,
  };
}
