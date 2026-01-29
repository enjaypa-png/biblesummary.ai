export default function ListenPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b px-4 py-3"
        style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <h1 className="text-xl font-semibold text-center" style={{ color: "var(--foreground)" }}>
          Listen
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" style={{ color: "var(--secondary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
          Audio Bible Coming Soon
        </h2>
        <p className="text-sm" style={{ color: "var(--secondary)" }}>
          Listen to the KJV Bible read aloud. Always free.
        </p>
      </main>
    </div>
  );
}

export const metadata = {
  title: "Listen - BibleSummary.ai",
  description: "Listen to the Bible read aloud. Free audio Bible.",
};
