"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navigation() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { href: "/", label: "How It Works" },
    { href: "/#features", label: "Features" },
    { href: "/#tools", label: "Tools" },
    { href: "/pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav
      className="border-b backdrop-blur-xl"
      style={{ backgroundColor: "var(--background-blur)", borderColor: "var(--border)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" fill="none" style={{ height: 40, width: "auto" }} role="img" aria-label="ClearBible.ai Logo">
            <rect x="4" y="6" width="42" height="52" rx="6" fill="#7c5cfc"/>
            <path d="M8 54 L8 56 C8 58 10 60 12 60 L40 60 C42 60 44 58 44 56 L44 54" fill="#e8e4f0" stroke="#d4d0e0" strokeWidth="0.5"/>
            <path d="M8 52 L8 54 C8 56 10 58 12 58 L40 58 C42 58 44 56 44 54 L44 52" fill="#f0ecf8" stroke="#d4d0e0" strokeWidth="0.5"/>
            <rect x="22" y="16" width="6" height="28" rx="1.5" fill="#f0c040"/>
            <rect x="15" y="23" width="20" height="6" rx="1.5" fill="#f0c040"/>
            <text x="58" y="34" fontFamily="'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fontSize="26" fontWeight="700" fill="#2d2b4e">ClearBible<tspan fill="#7c5cfc">.ai</tspan></text>
            <text x="58" y="48" fontFamily="'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fontSize="9" fontWeight="400" fill="#8b87a0">AI Verse Explanations &amp; Chapter Summaries</text>
            <text x="58" y="59" fontFamily="'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fontSize="9" fontWeight="400" fill="#8b87a0">AI Bible Ask/Search Feature</text>
          </svg>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
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

        {/* Right-side actions */}
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