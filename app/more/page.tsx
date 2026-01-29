import Link from "next/link";

export default function MorePage() {
  const menuItems = [
    { href: "/login", label: "Sign In", description: "Sync your notes across devices" },
    { href: "/signup", label: "Create Account", description: "Save your progress and notes" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b px-4 py-3"
        style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <h1 className="text-xl font-semibold text-center" style={{ color: "var(--foreground)" }}>
          More
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Account */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--secondary)" }}>
            Account
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {menuItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                style={{ borderBottom: i < menuItems.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <div>
                  <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                    {item.label}
                  </span>
                  <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>
                    {item.description}
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" style={{ color: "var(--secondary)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--secondary)" }}>
            About
          </h2>
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm mb-3" style={{ color: "var(--foreground)" }}>
              BibleSummary.ai helps you read, listen to, and finish the entire Bible.
            </p>
            <p className="text-sm mb-3" style={{ color: "var(--secondary)" }}>
              Bible text and audio are always free. We offer optional AI-generated book summaries
              that describe what each book contains without interpretation or theology.
            </p>
            <p className="text-sm" style={{ color: "var(--secondary)" }}>
              No subscriptions. No ads. No opinions.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export const metadata = {
  title: "More - BibleSummary.ai",
  description: "Settings and account for BibleSummary.ai.",
};
