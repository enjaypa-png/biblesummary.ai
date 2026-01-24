import Link from "next/link";
import Navigation from "@/components/Navigation";

/**
 * Homepage for BibleSummary.ai
 * Features: Logo, navigation, tagline, and CTA buttons
 */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo Placeholder */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-4xl">B</span>
            </div>
          </div>

          {/* App Name */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            BibleSummary.ai
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-8">
            Read, understand, and explore the Bible with clarity and insight
          </p>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Your modern companion for Bible study. Get AI-powered summaries, explore chapters,
            and deepen your understanding of Scripture.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/bible/genesis/1"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto text-center"
            >
              Start Reading
            </Link>
            <Link
              href="/signup"
              className="px-8 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>&copy; 2024 BibleSummary.ai. Built to help you understand Scripture.</p>
        </div>
      </footer>
    </div>
  );
}
