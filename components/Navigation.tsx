"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

/**
 * Navigation component with responsive design
 * Shows Home, Read Bible, and Sign In links
 */
export default function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/bible/genesis/1", label: "Read Bible" },
    { href: "/login", label: "Sign In" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            {/* Book icon — always visible */}
            <Image
              src="/brand/logo-icon.svg"
              alt="BibleSummary.ai"
              width={36}
              height={36}
              className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              style={{ objectFit: "contain" }}
              priority
            />
            {/* Brand text — hidden on mobile */}
            <span className="hidden sm:inline text-lg font-bold tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span className="text-gray-900 dark:text-white">Bible</span>
              <span className="text-gray-900 dark:text-white">Summary</span>
              <span style={{ color: "#7c3aed" }}>.ai</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-[var(--accent)]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                style={pathname === link.href ? { backgroundColor: "var(--accent-light)" } : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
