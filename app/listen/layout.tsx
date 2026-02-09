import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listen - BibleSummary.ai",
  description: "Listen to the Bible with verse-by-verse audio.",
};

export default function ListenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
