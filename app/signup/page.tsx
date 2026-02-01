"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        setSuccess(true);
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 2000);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-md mx-auto w-full px-6 pt-6">
        <Link
          href={redirect}
          className="text-[13px] font-medium flex items-center gap-1.5"
          style={{ color: "var(--accent)" }}
        >
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1
              className="font-semibold tracking-tight"
              style={{ color: "var(--foreground)", fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "clamp(1.75rem, 6vw, 2.25rem)" }}
            >
              Create Account
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: "var(--secondary)" }}>
              Start your Bible study journey
            </p>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <form onSubmit={handleSignUp} className="space-y-5">
              {error && (
                <div className="rounded-lg px-4 py-3 text-[13px]" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg px-4 py-3 text-[13px]" style={{ backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                  Account created! Redirecting you back...
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--secondary)" }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-[15px] outline-none"
                  style={{ backgroundColor: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--secondary)" }}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-[15px] outline-none"
                  style={{ backgroundColor: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                  placeholder="••••••••"
                  minLength={6}
                />
                <p className="mt-1 text-[11px]" style={{ color: "var(--secondary)" }}>
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--secondary)" }}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-[15px] outline-none"
                  style={{ backgroundColor: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full px-4 py-2.5 rounded-lg text-[15px] font-semibold text-white disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-[13px]" style={{ color: "var(--secondary)" }}>
                Already have an account?{" "}
                <Link
                  href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                  className="font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
