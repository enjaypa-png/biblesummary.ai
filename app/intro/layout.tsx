import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome - BibleSummary.ai",
  description: "A reverent introduction to Scripture",
};

/**
 * Intro Layout
 * 
 * Clean layout without navigation or tab bar.
 * Used only for the opening experience.
 */
export default function IntroLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="intro-layout">
      {children}
    </div>
  );
}
