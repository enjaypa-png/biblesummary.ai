"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase";

const PUBLIC_PATHS = ["/login", "/signup"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isPublic) {
      setChecked(true);
      setAuthed(true);
      return;
    }

    getCurrentUser().then((user) => {
      if (user && user.email_confirmed_at) {
        setAuthed(true);
      } else {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
      setChecked(true);
    });
  }, [pathname, isPublic, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <p className="text-[14px]" style={{ color: "var(--secondary)" }}>Loading...</p>
      </div>
    );
  }

  if (!authed) return null;

  return <>{children}</>;
}
