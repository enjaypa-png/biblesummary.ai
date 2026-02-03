import type { Metadata } from "next";
import "./globals.css";
import BottomTabBar from "@/components/BottomTabBar";
import AuthGate from "@/components/AuthGate";
import MiniPlayer from "@/components/MiniPlayer";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";

export const metadata: Metadata = {
  title: "BibleSummary.ai - Read & Understand the Bible",
  description: "A modern Bible reading app with AI-powered summaries. Read, listen, and retain. Always free Bible text, no subscriptions.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthGate>
          <AudioPlayerProvider>
            {children}
            <MiniPlayer />
            <BottomTabBar />
          </AudioPlayerProvider>
        </AuthGate>
      </body>
    </html>
  );
}
