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
          <Link href="/" className="flex items-center">
            {/* Full logo on desktop */}
            <Image
              src="/images/logo-full.svg"
              alt="BibleSummary.ai"
              width={220}
              height={44}
              className="hidden sm:block"
              priority
            />
            {/* Icon only on mobile */}
            <Image
              src="/images/logo-icon.svg"
              alt="BibleSummary.ai"
              width={36}
              height={42}
              className="block sm:hidden"
              priority
            />
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
