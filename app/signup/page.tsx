"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SUMMARY_INTENT_KEY = "biblesummary_summary_intent";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        options: {
          data: { email_confirmed: false },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        setStep("verify");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: "signup",
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        const raw = typeof window !== "undefined" ? localStorage.getItem(SUMMARY_INTENT_KEY) : null;
        const summaryIntent = raw === "yes" ? true : raw === "no" ? false : null;
        if (summaryIntent !== null) {
          await supabase.from("user_profiles").upsert({
            user_id: data.user.id,
            summary_intent: summaryIntent,
            onboarding_completed_at: new Date().toISOString(),
          });
        }
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        setError(error.message);
      }
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const inputStyle = {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-md mx-auto w-full px-6 pt-6">
        {step === "form" ? (
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
        ) : (
          <button
            onClick={() => { setStep("form"); setOtpCode(""); setError(null); }}
            className="text-[13px] font-medium flex items-center gap-1.5"
            style={{ color: "var(--accent)" }}
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        )}
      </div>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-md w-full">
          {step === "form" ? (
            <>
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
                      style={inputStyle}
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
                      style={inputStyle}
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
                      style={inputStyle}
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
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
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <h1
                  className="font-semibold tracking-tight"
                  style={{ color: "var(--foreground)", fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "clamp(1.75rem, 6vw, 2.25rem)" }}
                >
                  Verify Your Email
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--secondary)" }}>
                  We sent a verification code to<br />
                  <strong style={{ color: "var(--foreground)" }}>{email}</strong>
                </p>
              </div>

              <div className="rounded-xl p-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <form onSubmit={handleVerify} className="space-y-5">
                  {error && (
                    <div className="rounded-lg px-4 py-3 text-[13px]" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="otp" className="block text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--secondary)" }}>
                      Verification Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      className="w-full px-4 py-3 rounded-lg text-[24px] font-semibold text-center tracking-[0.4em] outline-none"
                      style={inputStyle}
                      placeholder="00000"
                      maxLength={5}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 5}
                    className="w-full px-4 py-2.5 rounded-lg text-[15px] font-semibold text-white disabled:opacity-50 transition-opacity"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-[13px]" style={{ color: "var(--secondary)" }}>
                    Didn&apos;t receive a code?{" "}
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="font-semibold"
                      style={{ color: "var(--accent)" }}
                    >
                      {resending ? "Sending..." : "Resend code"}
                    </button>
                  </p>
                </div>
              </div>
            </>
          )}
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
