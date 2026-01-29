export default function SearchPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b px-4 py-3"
        style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <h1 className="text-xl font-semibold text-center" style={{ color: "var(--foreground)" }}>
          Search
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" style={{ color: "var(--secondary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
          Search Coming Soon
        </h2>
        <p className="text-sm" style={{ color: "var(--secondary)" }}>
          Find any passage, verse, or keyword in the Bible.
        </p>
      </main>
    </div>
  );
}

export const metadata = {
  title: "Search - BibleSummary.ai",
  description: "Search the Bible for any passage, verse, or keyword.",
};
