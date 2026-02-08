import Link from "next/link";

export default function MorePage() {
  const menuItems = [
    { href: "/login", label: "Sign In", description: "Sync your notes across devices" },
    { href: "/signup", label: "Create Account", description: "Save your progress and notes" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
          More
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-5 py-6">
        {/* Account */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-2 px-1"
            style={{ color: "var(--secondary)" }}>
            Account
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            {menuItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-3 transition-colors active:bg-black/5 dark:active:bg-white/5"
                style={{ borderBottom: i < menuItems.length - 1 ? "0.5px solid var(--border)" : "none" }}
              >
                <div>
                  <span className="font-medium text-[15px]" style={{ color: "var(--foreground)" }}>
                    {item.label}
                  </span>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--secondary)" }}>
                    {item.description}
                  </p>
                </div>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-2 px-1"
            style={{ color: "var(--secondary)" }}>
            About
          </h2>
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <p className="text-[14px] leading-relaxed mb-3" style={{ color: "var(--foreground)" }}>
              BibleSummary.ai helps you read, listen to, and finish the entire Bible.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              Bible text and audio are always free. We offer optional AI-generated book summaries
              that describe what each book contains without interpretation or theology.
            </p>
            <p className="text-[13px] font-medium" style={{ color: "var(--secondary)" }}>
              No ads. No opinions.
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
