import type { Metadata } from "next";
import "./globals.css";
import BottomTabBar from "@/components/BottomTabBar";
import AuthGate from "@/components/AuthGate";
import SessionTracker from "@/components/SessionTracker";
import MiniPlayer from "@/components/MiniPlayer";
import ReadingSettingsPanel from "@/components/ReadingSettingsPanel";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { ReadingSettingsProvider } from "@/contexts/ReadingSettingsContext";

export const metadata: Metadata = {
  title: "BibleSummary.ai - Read & Understand the Bible",
  description: "A modern Bible reading app with AI-powered summaries. Read, listen, and retain. Always free Bible text.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#4A2D8A",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&family=Spectral:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <AuthGate>
          <ReadingSettingsProvider>
            <AudioPlayerProvider>
              <SessionTracker />
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
