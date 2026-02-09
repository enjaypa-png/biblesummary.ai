import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Now Playing - BibleSummary.ai",
  description: "Listen to the Bible chapter.",
};

export default function ListenPlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
