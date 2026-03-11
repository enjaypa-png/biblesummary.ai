import type { Metadata } from "next";
import "./globals.css";
import BottomTabBar from "@/components/BottomTabBar";
import AuthGate from "@/components/AuthGate";
import ConditionalNav from "@/components/ConditionalNav";
import SessionTracker from "@/components/SessionTracker";
import MiniPlayer from "@/components/MiniPlayer";
import ReadingSettingsPanel from "@/components/ReadingSettingsPanel";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { ReadingSettingsProvider } from "@/contexts/ReadingSettingsContext";

export const metadata: Metadata = {
  title: "ClearBible.ai — Read the Bible in Plain English | Free Bible App",
  description: "Read the Bible in plain, clear English — free. The Clear Bible Translation makes scripture easy to understand for the first time. AI Bible Search, verse explanations, audio, notes & more.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#7c5cfc",
  icons: {
    icon: "/brand/logo-192.png",
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "ClearBible.ai — Read the Bible in Plain English",
    description: "The Bible, finally easy to understand. Free forever. Read the Clear Bible Translation or KJV, listen to audio, search with AI, and get AI explanations for any verse.",
    url: "https://clearbible.ai",
    siteName: "ClearBible.ai",
    images: [{ url: "https://clearbible.ai/brand/og-image.png", width: 1200, height: 630, alt: "ClearBible.ai — Read the Bible in Plain English" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClearBible.ai — Read the Bible in Plain English",
    description: "The Bible, finally easy to understand. Free forever.",
    images: ["https://clearbible.ai/brand/og-image.png"],
  },
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
        <link rel="icon" type="image/png" href="/brand/logo-192.png" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
        <meta name="theme-color" content="#7c5cfc" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <AuthGate>
          <ReadingSettingsProvider>
            <AudioPlayerProvider>
              <SessionTracker />
              <ConditionalNav />
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
