export default function SearchPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
          Search
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7" style={{ color: "var(--accent)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <h2 className="text-[17px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
          Search Coming Soon
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--secondary)" }}>
          Find any passage, verse, or keyword in the Bible.
        </p>
      </main>
    </div>
  );
}

export const metadata = {
  title: "Search - ClearBible.ai",
  description: "Search the Bible for any passage, verse, or keyword.",
};
