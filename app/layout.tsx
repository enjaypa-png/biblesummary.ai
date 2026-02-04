import type { Metadata } from "next";
import "./globals.css";
import BottomTabBar from "@/components/BottomTabBar";
import AuthGate from "@/components/AuthGate";
import MiniPlayer from "@/components/MiniPlayer";
import ReadingSettingsPanel from "@/components/ReadingSettingsPanel";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { ReadingSettingsProvider } from "@/contexts/ReadingSettingsContext";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Lora:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthGate>
          <ReadingSettingsProvider>
            <AudioPlayerProvider>
              {children}
              <MiniPlayer />
              <ReadingSettingsPanel />
              <BottomTabBar />
            </AudioPlayerProvider>
          </ReadingSettingsProvider>
        </AuthGate>
      </body>
    </html>
  );
}
