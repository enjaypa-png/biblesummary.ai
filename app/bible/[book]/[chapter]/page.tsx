import Navigation from "@/components/Navigation";
import Link from "next/link";

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

export default function BibleChapterPage({ params }: PageProps) {
  // Capitalize book name for display
  const bookName = params.book.charAt(0).toUpperCase() + params.book.slice(1);
  const chapterNumber = params.chapter;

  // Parse chapter number for navigation
  const currentChapter = parseInt(chapterNumber);
  const prevChapter = currentChapter > 1 ? currentChapter - 1 : null;
  const nextChapter = currentChapter + 1; // We'll add max chapter validation later

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chapter Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {bookName} {chapterNumber}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bible text will be loaded here from the database
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <span className="font-semibold text-gray-500 dark:text-gray-400 mr-2">1</span>
              In the beginning... (Placeholder verse)
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <span className="font-semibold text-gray-500 dark:text-gray-400 mr-2">2</span>
              This is where the actual Bible text will appear...
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <span className="font-semibold text-gray-500 dark:text-gray-400 mr-2">3</span>
              We&apos;ll add real Bible data in the next steps.
            </p>
          </div>
        </div>

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

          <Link
            href={`/bible/${params.book}/${nextChapter}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Chapter {nextChapter} →
          </Link>
        </div>
      </main>
    </div>
  );
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps) {
  const bookName = params.book.charAt(0).toUpperCase() + params.book.slice(1);

  return {
    title: `${bookName} ${params.chapter} - BibleSummary.ai`,
    description: `Read ${bookName} chapter ${params.chapter} with AI-powered summaries and insights`,
  };
}
