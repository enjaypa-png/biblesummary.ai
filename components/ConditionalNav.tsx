"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";

// Show the marketing nav on these path prefixes (and the homepage)
const MARKETING_PREFIXES = [
  "/pricing",
  "/privacy",
  "/terms",
  "/refunds",
  "/blog",
  "/tools",
  "/features",
  "/how-it-works",
  "/search",
];

export default function ConditionalNav() {
  const pathname = usePathname();
  const show =
    pathname === "/" ||
    MARKETING_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!show) return null;
  return <Navigation />;
}
