import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "More - BibleSummary.ai",
  description: "Settings and account for BibleSummary.ai.",
};

export default function MoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
