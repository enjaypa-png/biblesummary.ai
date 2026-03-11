"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/features", label: "Features" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

export default function MarketingNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="marketing-nav">
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo — large and clear */}
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/brand/logo.png"
            alt="ClearBible"
            width={200}
            height={48}
            priority
            style={{ height: 48, width: "auto", objectFit: "contain" }}
          />
        </Link>

        {/* Desktop nav links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          className="hidden md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              style={{
                color: pathname === link.href ? "#7C5CFC" : undefined,
                background: pathname === link.href ? "rgba(124, 92, 252, 0.05)" : undefined,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/login"
            className="nav-link hidden sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="btn-primary"
            style={{ padding: "10px 20px", fontSize: 14, borderRadius: 12 }}
          >
            Start Reading Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "none",
              border: "none",
              padding: 8,
              cursor: "pointer",
              color: "#2a2520",
            }}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </>
              ) : (
                <>
                  <path d="M3 12h18" />
                  <path d="M3 6h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            padding: "8px 24px 24px",
            borderTop: "1px solid #e8e5e0",
            background: "#fff",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: 15,
                fontWeight: 500,
                color: pathname === link.href ? "#7C5CFC" : "#2a2520",
                textDecoration: "none",
                borderBottom: "1px solid #f0ede8",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "block",
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 500,
              color: "#2a2520",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
