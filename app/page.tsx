"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasSeenIntro } from "@/lib/intro-state";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (hasSeenIntro()) {
      router.replace("/bible");
    } else {
      router.replace("/intro");
    }
  }, [router]);

  // Brief blank screen while checking
  return <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }} />;
}
