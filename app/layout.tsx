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
  themeColor: "#7c5cfc",
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
        <meta property="og:image" content="/brand/logo-512.png" />
        <meta name="theme-color" content="#7c5cfc" />
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
