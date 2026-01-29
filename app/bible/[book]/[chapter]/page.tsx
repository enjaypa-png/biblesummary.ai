import Navigation from "@/components/Navigation";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';

/**
 * Dynamic route for Bible chapters
 * URL format: /bible/[book]/[chapter]
 * Example: /bible/genesis/1 or /bible/john/3
 */
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get book information
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, name, slug, total_chapters')
    .eq('slug', bookSlug)
    .single();

  if (bookError || !book) {
    return { book: null, verses: [], error: 'Book not found' };
  }

  // Get verses for this chapter
  const { data: verses, error: versesError } = await supabase
    .from('verses')
    .select('id, verse, text')
    .eq('book_id', book.id)
    .eq('chapter', chapterNum)
    .order('verse');

  if (versesError) {
    return { book, verses: [], error: 'Verses not found' };
  }

  return { book, verses: verses || [], error: null };
}

export default async function BibleChapterPage({ params }: PageProps) {
  const chapterNumber = params.chapter;
  const currentChapter = parseInt(chapterNumber);

  // Fetch Bible data
  const { book, verses, error } = await getBibleData(params.book, currentChapter);

  // Calculate navigation
  const prevChapter = currentChapter > 1 ? currentChapter - 1 : null;
  const nextChapter = (book && currentChapter < book.total_chapters) ? currentChapter + 1 : null;
  const bookName = book ? book.name : params.book.charAt(0).toUpperCase() + params.book.slice(1);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chapter Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {bookName} {chapterNumber}
          </h1>
          {book && (
            <p className="text-gray-600 dark:text-gray-400">
              King James Version
            </p>
          )}
        </div>

        {/* Bible Text */}
        {error ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6 mb-8">
            <p className="text-gray-700 dark:text-gray-300">
              {error === 'Book not found'
                ? `The book "${params.book}" was not found. Please check the URL.`
                : 'No verses found for this chapter. The Bible data may not be loaded yet.'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Make sure you have run the seed scripts to load the Bible data.
            </p>
          </div>
        ) : verses.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="prose dark:prose-invert max-w-none">
              {verses.map((verse: Verse) => (
                <p key={verse.id} className="text-gray-700 dark:text-gray-300 mb-4">
                  <span className="font-semibold text-gray-500 dark:text-gray-400 mr-2">
                    {verse.verse}
                  </span>
                  {verse.text}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-8">
            <p className="text-gray-700 dark:text-gray-300">
              Loading Bible text... If this message persists, you may need to run the seed scripts to load the Bible data.
            </p>
          </div>
        )}

        {/* AI Summary Placeholder */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            AI Summary
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            AI-powered chapter summary will appear here once we integrate the summary feature.
          </p>
        </div>

        {/* Chapter Navigation */}
        <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-6">
          {prevChapter ? (
            <Link
              href={`/bible/${params.book}/${prevChapter}`}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ← Chapter {prevChapter}
            </Link>
          ) : (
            <div></div>
          )}

          {nextChapter ? (
            <Link
              href={`/bible/${params.book}/${nextChapter}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Chapter {nextChapter} →
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: book } = await supabase
    .from('books')
    .select('name')
    .eq('slug', params.book)
    .single();

  const bookName = book ? book.name : params.book.charAt(0).toUpperCase() + params.book.slice(1);

  return {
    title: `${bookName} ${params.chapter} - BibleSummary.ai`,
    description: `Read ${bookName} chapter ${params.chapter} with AI-powered summaries and insights`,
  };
}
