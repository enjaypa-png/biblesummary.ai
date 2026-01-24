import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BibleSummary.ai - Read & Understand the Bible",
  description: "A modern Bible reading app with AI-powered summaries and insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
