"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

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
          <Image
            src="/brand/logo.png"
            alt="ClearBible.ai"
            width={300}
            height={78}
            priority
            style={{ width: "auto", height: 78, objectFit: "contain" }}
          />
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
        </div>

      </div>
    </nav>
  );
}