"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

/** Routes that use the marketing navigation */
const MARKETING_PATHS = ["/", "/pricing", "/blog", "/terms", "/privacy", "/refunds", "/login", "/signup", "/onboarding"];

function isMarketingPage(pathname: string): boolean {
  return MARKETING_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
  );
}

/* ─── Marketing nav links ─── */
const marketingLinks = [
  { href: "/", label: "How It Works" },
  { href: "/#features", label: "Features" },
  { href: "/#tools", label: "Tools" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

/* ─── App nav links (Bible study) ─── */
const appLinks = [
  { href: "/bible", label: "Books" },
  { href: "/bible?askai=1", label: "Ask AI" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/notes", label: "Notes" },
  { href: "/more", label: "Settings" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isMarketing = isMarketingPage(pathname);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/bible?askai=1") return pathname.startsWith("/bible") && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("askai") === "1";
    if (href === "/bible") return pathname.startsWith("/bible") && !(typeof window !== "undefined" && new URLSearchParams(window.location.search).get("askai") === "1");
    return pathname === href || pathname.startsWith(href + "/");
  };

  if (isMarketing) {
    /* ─── Marketing Navigation ─── */
    return (
      <nav
        className="border-b backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderColor: "var(--border)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {marketingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={
                  isActive(link.href)
                    ? { color: "var(--accent)", backgroundColor: "var(--accent-light)" }
                    : { color: "var(--foreground-secondary)" }
                }
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/bible"
                className="inline-flex items-center justify-center rounded-full text-sm font-semibold px-4 py-1.5"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                Open Bible
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium"
                  style={{ color: "var(--foreground-secondary)" }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full text-sm font-semibold px-4 py-1.5"
                  style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                >
                  Start Reading Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  /* ─── App Navigation (Bible study) ─── */
  return (
    <nav
      className="border-b backdrop-blur-xl"
      style={{ backgroundColor: "var(--background-blur)", borderColor: "var(--border)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/bible" className="flex items-center">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {appLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={
                isActive(link.href)
                  ? { color: "var(--accent)", backgroundColor: "var(--accent-light)" }
                  : { color: "var(--foreground-secondary)" }
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
