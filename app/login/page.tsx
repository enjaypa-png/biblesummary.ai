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
  const oauthError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    oauthError === "oauth_exchange_failed"
      ? "Google sign-in didn\u2019t complete. Please try again."
      : null
  );
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
                  Welcome back to ClearBible.ai
                </p>
              </div>

              <div className="rounded-xl p-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback`,
                        queryParams: {
                          prompt: "select_account",
                        },
                      },
                    });
                    if (error) setError(error.message);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-colors hover:bg-gray-50 active:bg-gray-100"
                  style={{
                    backgroundColor: "#fff",
                    color: "#3c4043",
                    border: "1px solid #dadce0",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58Z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                  <span className="text-[12px] uppercase tracking-wider font-medium" style={{ color: "var(--secondary)" }}>or</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                </div>

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
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setResendSuccess(false); }}
                      className="w-full px-4 py-3 rounded-lg text-[24px] font-semibold text-center tracking-[0.4em] outline-none"
                      style={inputStyle}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
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
