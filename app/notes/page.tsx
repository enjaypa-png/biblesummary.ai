export default function NotesPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b px-4 py-3"
        style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <h1 className="text-xl font-semibold text-center" style={{ color: "var(--foreground)" }}>
          Notes
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" style={{ color: "var(--secondary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
          Your notes will appear here
        </h2>
        <p className="text-sm" style={{ color: "var(--secondary)" }}>
          Tap a verse while reading to create your first note. Notes are private and never shared.
        </p>
      </main>
    </div>
  );
}

export const metadata = {
  title: "Notes - BibleSummary.ai",
  description: "Your private Bible notes. Never shared, never analyzed.",
};
