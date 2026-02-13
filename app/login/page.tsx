"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function needsOnboarding(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_profiles")
    .select("onboarding_completed_at")
    .eq("user_id", userId)
    .single();
  return !data?.onboarding_completed_at;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/";
  const redirect = redirectParam.startsWith("/onboarding") ? "/" : redirectParam;
  const [step, setStep] = useState<"login" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          // Resend confirmation and show verify step
          await supabase.auth.resend({ type: "signup", email });
          setStep("verify");
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        const showOnboarding = await needsOnboarding(data.user.id);
        router.push(showOnboarding ? "/onboarding" : redirect);
        router.refresh();
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
        if (error.message.toLowerCase().includes("token has expired") || error.message.toLowerCase().includes("otp_expired")) {
          setError("That code has expired. Tap \"Resend code\" below to get a new one.");
          setOtpCode("");
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        // Now sign in with password since they're verified
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        if (signInData.user) {
          const showOnboarding = await needsOnboarding(signInData.user.id);
          router.push(showOnboarding ? "/onboarding" : redirect);
          router.refresh();
        }
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
    setResendSuccess(false);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        setError(error.message);
      } else {
        setOtpCode("");
        setResendSuccess(true);
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
        {step === "login" ? (
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
            onClick={() => { setStep("login"); setOtpCode(""); setError(null); }}
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
          {step === "login" ? (
            <>
              <div className="text-center mb-8">
                <h1
                  className="font-semibold tracking-tight"
                  style={{ color: "var(--foreground)", fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "clamp(1.75rem, 6vw, 2.25rem)" }}
                >
                  Sign In
                </h1>
                <p className="mt-2 text-[14px]" style={{ color: "var(--secondary)" }}>
                  Welcome back to BibleSummary.ai
                </p>
              </div>

              <div className="rounded-xl p-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <form onSubmit={handleLogin} className="space-y-5">
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
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2.5 rounded-lg text-[15px] font-semibold text-white disabled:opacity-50 transition-opacity"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-[13px]" style={{ color: "var(--secondary)" }}>
                    Don&apos;t have an account?{" "}
                    <Link
                      href={`/signup${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                      className="font-semibold"
                      style={{ color: "var(--accent)" }}
                    >
                      Sign up
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
                  {resendSuccess && !error && (
                    <div className="rounded-lg px-4 py-3 text-[13px]" style={{ backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                      A new code has been sent to your email.
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
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 5)); setResendSuccess(false); }}
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
                    {loading ? "Verifying..." : "Verify & Sign In"}
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
