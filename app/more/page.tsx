"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function MorePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u ?? null);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const unauthenticatedMenuItems = [
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
            {loading ? (
              <div className="px-4 py-3" style={{ color: "var(--secondary)" }}>
                <span className="text-[14px]">Loading…</span>
              </div>
            ) : !user ? (
              unauthenticatedMenuItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-4 py-3 transition-colors active:bg-black/5 dark:active:bg-white/5"
                  style={{ borderBottom: i < unauthenticatedMenuItems.length - 1 ? "0.5px solid var(--border)" : "none" }}
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
              ))
            ) : (
              <>
                <div className="px-4 py-3" style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
                    Email
                  </span>
                  <p className="text-[15px] mt-1 truncate" style={{ color: "var(--foreground)" }} title={user.email ?? undefined}>
                    {user.email ?? "—"}
                  </p>
                </div>
                <div className="px-4 py-3" style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
                    Status
                  </span>
                  <p className="text-[15px] mt-1" style={{ color: "var(--foreground)" }}>
                    Bible & audio free
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors active:bg-black/5 dark:active:bg-white/5 text-left"
                >
                  <span className="font-medium text-[15px]" style={{ color: "var(--foreground)" }}>
                    Sign Out
                  </span>
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                    <path d="M1 1L5 5L1 9" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
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
              BibleSummary.ai helps you read, listen to, and finish the entire Bible—without losing track of where you are or what you&apos;ve already read.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              Bible text and audio are always free. We offer optional AI-generated book summaries designed to help you retain what you read, understand the structure of each book, and return to Scripture with clarity instead of starting over.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              Summaries describe what each book contains without interpretation or theology, helping you stay oriented as you move forward.
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
