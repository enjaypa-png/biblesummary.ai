"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut, supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import BrandName from "@/components/BrandName";
import {
  useReadingSettings,
  FontFamily,
  BibleTranslation,
  TRANSLATION_LABELS,
  VOICE_IDS,
} from "@/contexts/ReadingSettingsContext";

interface Subscription {
  type: string;
  status: string;
  current_period_end: string;
}

interface VoiceInfo {
  id: string;
  name: string;
  description?: string;
}

const fontOptions: { value: FontFamily; label: string; fontStack: string }[] = [
  { value: "Libre Baskerville", label: "Baskerville", fontStack: "'Libre Baskerville', serif" },
  { value: "Spectral", label: "Spectral", fontStack: "'Spectral', serif" },
  { value: "Source Sans 3", label: "Source", fontStack: "'Source Sans 3', sans-serif" },
  { value: "System", label: "System", fontStack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
];

const themeOptions: { value: "light" | "sepia" | "gray" | "dark"; label: string; bg: string; borderColor: string }[] = [
  { value: "light", label: "Light", bg: "#FFFFFF", borderColor: "rgba(0,0,0,0.1)" },
  { value: "sepia", label: "Sepia", bg: "#F8F1E3", borderColor: "rgba(0,0,0,0.1)" },
  { value: "gray", label: "Gray", bg: "#E8E8E8", borderColor: "rgba(0,0,0,0.1)" },
  { value: "dark", label: "Dark", bg: "#1a1a1a", borderColor: "rgba(255,255,255,0.2)" },
];

export default function MorePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [canceling, setCanceling] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const router = useRouter();
  const {
    settings,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setThemeMode,
    setVoiceId,
    setTranslation,
  } = useReadingSettings();

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser();
      setUser(u ?? null);
      setLoading(false);

      if (u) {
        const { data } = await supabase
          .from("subscriptions")
          .select("type, status, current_period_end")
          .eq("user_id", u.id);
        if (data) {
          setSubscriptions(data.filter((s: Subscription) => s.status === "active" || s.status === "canceled"));
        }
      }
    }
    load();
  }, []);

  // Fetch voices
  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((data: VoiceInfo[]) => setVoices(data))
      .catch(() => {
        setVoices(VOICE_IDS.map((id) => ({ id, name: id.slice(0, 8) })));
      });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  async function handleCancel(subscriptionType: string) {
    if (!confirm("Are you sure you want to cancel? You'll keep access until the end of your current billing period.")) {
      return;
    }

    setCanceling(subscriptionType);
    setCancelError(null);
    setCancelMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setCancelError("Please sign in again.");
        setCanceling(null);
        return;
      }

      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ subscriptionType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCancelError(data.error || "Failed to cancel");
        setCanceling(null);
        return;
      }

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.type === subscriptionType ? { ...s, status: "canceled" } : s
        )
      );
      setCancelMessage(
        "Your subscription will remain active until the end of your current billing period. No future charges will occur."
      );
    } catch {
      setCancelError("Network error. Please try again.");
    }
    setCanceling(null);
  }

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "DELETE") return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setDeleteError("Please sign in again.");
        setDeleting(false);
        return;
      }

      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || "Failed to delete account.");
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleting(false);
    }
  }, [deleteConfirmText, router]);

  function getSubscriptionLabel(type: string): string {
    switch (type) {
      case "explain_monthly": return "Verse Explain";
      case "summary_annual": return "Summary Pass";
      case "premium_yearly": return "Unlimited";
      default: return type;
    }
  }

  function getSubscriptionPrice(type: string): string {
    switch (type) {
      case "explain_monthly": return "$4.99/mo";
      case "summary_annual": return "$14.99/yr";
      case "premium_yearly": return "$79/yr";
      default: return "";
    }
  }

  const unauthenticatedMenuItems = [
    { href: "/login", label: "Sign In", description: "Sync your notes across devices" },
    { href: "/signup", label: "Create Account", description: "Save your progress and notes" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--background-blur)", borderBottom: "0.5px solid var(--border)" }}>
        <h1 className="text-[17px] font-semibold text-center max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
          Settings
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-5 py-6 pb-32">

        {/* ── Translation ── */}
        <section className="mb-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-1"
            style={{ color: "var(--secondary)" }}>
            Translation
          </h2>
          <div className="flex gap-2">
            {(["ct", "kjv", "web"] as BibleTranslation[]).map((t) => {
              const active = settings.translation === t;
              return (
                <button
                  key={t}
                  onClick={() => setTranslation(t)}
                  className="flex-1 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-center"
                  style={{
                    backgroundColor: active ? "var(--accent)" : "var(--card)",
                    color: active ? "#FFFFFF" : "var(--foreground)",
                    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  {TRANSLATION_LABELS[t].name}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Appearance ── */}
        <section className="mb-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-1"
            style={{ color: "var(--secondary)" }}>
            Appearance
          </h2>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>

            {/* Theme */}
            <div className="mb-5">
              <span className="text-[12px] font-medium mb-2.5 block" style={{ color: "var(--secondary)" }}>
                Theme
              </span>
              <div className="flex gap-3">
                {themeOptions.map((t) => {
                  const active = settings.themeMode === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setThemeMode(t.value)}
                      className="flex-1 flex flex-col items-center gap-1.5"
                    >
                      <div
                        className="w-full aspect-square rounded-xl border-2 transition-all flex items-center justify-center"
                        style={{
                          backgroundColor: t.bg,
                          borderColor: active ? "var(--accent)" : t.borderColor,
                          boxShadow: active ? "0 0 0 2px var(--accent)" : "none",
                        }}
                      >
                        {active && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: active ? "var(--accent)" : "var(--secondary)" }}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font */}
            <div className="mb-5">
              <span className="text-[12px] font-medium mb-2.5 block" style={{ color: "var(--secondary)" }}>
                Font
              </span>
              <div className="grid grid-cols-4 gap-2">
                {fontOptions.map((font) => {
                  const active = settings.fontFamily === font.value;
                  return (
                    <button
                      key={font.value}
                      onClick={() => setFontFamily(font.value)}
                      className="px-2 py-2 rounded-xl text-[12px] font-medium transition-all text-center"
                      style={{
                        fontFamily: font.fontStack,
                        backgroundColor: active ? "var(--accent)" : "var(--background)",
                        color: active ? "#FFFFFF" : "var(--foreground)",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      }}
                    >
                      {font.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Size */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[12px] font-medium" style={{ color: "var(--secondary)" }}>
                  Text Size
                </span>
                <span className="text-[12px] font-medium tabular-nums" style={{ color: "var(--secondary)" }}>
                  {settings.fontSize}px
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-medium" style={{ color: "var(--secondary)" }}>A</span>
                <div className="flex-1">
                  <input
                    type="range"
                    min={14}
                    max={28}
                    step={1}
                    value={settings.fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer settings-range"
                    style={{
                      background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((settings.fontSize - 14) / 14) * 100}%, var(--border) ${((settings.fontSize - 14) / 14) * 100}%, var(--border) 100%)`,
                    }}
                  />
                </div>
                <span className="text-[18px] font-medium" style={{ color: "var(--secondary)" }}>A</span>
              </div>
            </div>

            {/* Line Spacing */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[12px] font-medium" style={{ color: "var(--secondary)" }}>
                  Line Spacing
                </span>
                <span className="text-[12px] font-medium tabular-nums" style={{ color: "var(--secondary)" }}>
                  {settings.lineHeight.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLineHeight(1.4)}
                  className="w-5 flex flex-col gap-[2px] active:opacity-60 transition-opacity"
                  aria-label="Minimum line spacing"
                >
                  <div className="h-[1.5px] rounded-full" style={{ backgroundColor: "var(--secondary)", width: "16px" }} />
                  <div className="h-[1.5px] rounded-full" style={{ backgroundColor: "var(--secondary)", width: "16px" }} />
                  <div className="h-[1.5px] rounded-full" style={{ backgroundColor: "var(--secondary)", width: "16px" }} />
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min={1.4}
                    max={2.4}
                    step={0.1}
                    value={settings.lineHeight}
                    onChange={(e) => setLineHeight(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer settings-range"
                    style={{
                      background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((settings.lineHeight - 1.4) / 1.0) * 100}%, var(--border) ${((settings.lineHeight - 1.4) / 1.0) * 100}%, var(--border) 100%)`,
                    }}
                  />
                </div>
                <button
                  onClick={() => setLineHeight(2.4)}
                  className="w-5 flex flex-col gap-[4px] active:opacity-60 transition-opacity"
                  aria-label="Maximum line spacing"
                >
                  <div className="h-[1.5px] rounded-full" style={{ backgroundColor: "var(--secondary)", width: "16px" }} />
                  <div className="h-[1.5px] rounded-full" style={{ backgroundColor: "var(--secondary)", width: "16px" }} />
                  <div className="h-[1.5px] rounded-full" style={{ backgroundColor: "var(--secondary)", width: "16px" }} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Narrator Voice ── */}
        {voices.length > 0 && (
          <section className="mb-7">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-1"
              style={{ color: "var(--secondary)" }}>
              Narrator Voice
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {voices.map((voice) => {
                const isSelected = settings.voiceId === voice.id;
                return (
                  <button
                    key={voice.id}
                    onClick={() => setVoiceId(voice.id)}
                    className="px-3.5 py-3 rounded-xl transition-all text-left"
                    style={{
                      backgroundColor: isSelected ? "var(--accent)" : "var(--card)",
                      border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    <span
                      className="block text-[13px] font-semibold leading-tight"
                      style={{ color: isSelected ? "#FFFFFF" : "var(--foreground)" }}
                    >
                      {voice.name}
                    </span>
                    {voice.description && (
                      <span
                        className="block text-[11px] leading-tight mt-1"
                        style={{
                          color: isSelected ? "rgba(255,255,255,0.75)" : "var(--secondary)",
                        }}
                      >
                        {voice.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Account ── */}
        <section className="mb-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-1"
            style={{ color: "var(--secondary)" }}>
            Account
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            {loading ? (
              <div className="px-4 py-3" style={{ color: "var(--secondary)" }}>
                <span className="text-[14px]">Loading…</span>
              </div>
            ) : !user ? (
              unauthenticatedMenuItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-4 py-3.5 transition-colors active:bg-black/5 dark:active:bg-white/5"
                  style={{ borderBottom: i < unauthenticatedMenuItems.length - 1 ? "0.5px solid var(--border)" : "none" }}
                >
                  <div>
                    <span className="font-medium text-[15px]" style={{ color: "var(--foreground)" }}>
                      {item.label}
                    </span>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--secondary)" }}>
                      {item.description}
                    </p>
                  </div>
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                    <path d="M1 1L5 5L1 9" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ))
            ) : (
              <>
                <div className="px-4 py-3.5" style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
                    Email
                  </span>
                  <p className="text-[15px] mt-1 truncate" style={{ color: "var(--foreground)" }} title={user.email ?? undefined}>
                    {user.email ?? "—"}
                  </p>
                </div>
                <div className="px-4 py-3.5" style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
                    Status
                  </span>
                  <p className="text-[14px] mt-1 leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {subscriptions.some((s) => s.status === "active")
                      ? "AI features (Bible Search, explanations, summaries) are active."
                      : "Bible text is free. AI features available with upgrade."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between px-4 py-3.5 transition-colors active:bg-black/5 dark:active:bg-white/5 text-left"
                >
                  <span className="font-medium text-[15px]" style={{ color: "var(--foreground)" }}>
                    Sign Out
                  </span>
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                    <path d="M1 1L5 5L1 9" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </section>

        {/* ── Subscriptions ── */}
        {user && subscriptions.length > 0 && (
          <section className="mb-7">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-1"
              style={{ color: "var(--secondary)" }}>
              Subscriptions
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
              {subscriptions.map((sub, i) => (
                <div
                  key={sub.type}
                  className="px-4 py-3.5"
                  style={{ borderBottom: i < subscriptions.length - 1 ? "0.5px solid var(--border)" : "none" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-[15px]" style={{ color: "var(--foreground)" }}>
                        {getSubscriptionLabel(sub.type)}
                      </span>
                      <span className="text-[13px] ml-2" style={{ color: "var(--secondary)" }}>
                        {getSubscriptionPrice(sub.type)}
                      </span>
                    </div>
                    <span
                      className="text-[12px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: sub.status === "active" ? "rgba(5, 150, 105, 0.1)" : "rgba(217, 119, 6, 0.1)",
                        color: sub.status === "active" ? "var(--success)" : "var(--warning)",
                      }}
                    >
                      {sub.status === "active" ? "Active" : "Cancels soon"}
                    </span>
                  </div>

                  {sub.status === "canceled" && (
                    <p className="text-[12px] mt-1" style={{ color: "var(--secondary)" }}>
                      Access until {new Date(sub.current_period_end).toLocaleDateString()}
                    </p>
                  )}

                  {sub.status === "active" && (
                    <div className="mt-2">
                      <p className="text-[12px] mb-1.5" style={{ color: "var(--secondary)" }}>
                        Renews {new Date(sub.current_period_end).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleCancel(sub.type)}
                        disabled={canceling !== null}
                        className="text-[13px] font-medium transition-opacity active:opacity-70 disabled:opacity-50"
                        style={{ color: "var(--error)" }}
                      >
                        {canceling === sub.type ? "Canceling…" : "Cancel subscription"}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {(cancelError || cancelMessage) && (
                <div className="px-4 py-2" style={{ borderTop: "0.5px solid var(--border)" }}>
                  {cancelError && (
                    <p className="text-[13px]" style={{ color: "var(--error)" }}>
                      {cancelError}
                    </p>
                  )}
                  {cancelMessage && (
                    <p className="text-[13px] mt-0.5" style={{ color: "var(--secondary)" }}>
                      {cancelMessage}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  setBillingLoading(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) return;
                    const res = await fetch("/api/stripe/create-portal-session", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}`,
                      },
                    });
                    const data = await res.json();
                    if (res.ok && data.url) {
                      window.location.href = data.url;
                    }
                  } catch {
                    // silently fail
                  } finally {
                    setBillingLoading(false);
                  }
                }}
                disabled={billingLoading}
                className="w-full flex items-center justify-between px-4 py-3.5 transition-colors active:bg-black/5 dark:active:bg-white/5 text-left disabled:opacity-50"
                style={{ borderTop: "0.5px solid var(--border)" }}
              >
                <span className="font-medium text-[15px]" style={{ color: "var(--accent, #7c5cfc)" }}>
                  {billingLoading ? "Loading…" : "Manage Billing"}
                </span>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* ── About ── */}
        <section className="mb-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-1"
            style={{ color: "var(--secondary)" }}>
            About
          </h2>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <p className="text-[14px] leading-relaxed mb-2" style={{ color: "var(--foreground)" }}>
              <BrandName /> helps you read, listen to, search, and finish the entire Bible.
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--secondary)" }}>
              Two translations available: KJV and Clear Bible Translation. Bible text and audio are always free. AI features are optional.
            </p>
          </div>
        </section>

        {/* ── Legal ── */}
        <section className="mb-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-1"
            style={{ color: "var(--secondary)" }}>
            Legal
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            {[
              { href: "/pricing", label: "Pricing" },
              { href: "/terms", label: "Terms of Service" },
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/refunds", label: "Refund Policy" },
            ].map((item, i, arr) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-3 transition-colors active:bg-black/5 dark:active:bg-white/5"
                style={{ borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none" }}
              >
                <span className="font-medium text-[15px]" style={{ color: "var(--foreground)" }}>
                  {item.label}
                </span>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
          <p className="text-[12px] mt-2 px-1" style={{ color: "var(--secondary)" }}>
            Contact: support@clearbible.ai
          </p>
        </section>

        {/* ── Danger Zone ── */}
        {user && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-1"
              style={{ color: "#DC2626" }}>
              Danger Zone
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(220, 38, 38, 0.3)" }}>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(""); setDeleteError(null); }}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors active:bg-red-50 dark:active:bg-red-950/20 text-left"
              >
                <span className="font-medium text-[15px]" style={{ color: "#DC2626" }}>
                  Delete Account
                </span>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setShowDeleteModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}
          >
            <h3 className="text-[17px] font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              Delete Account
            </h3>
            <p className="text-[14px] leading-relaxed mb-4" style={{ color: "var(--secondary)" }}>
              This will permanently delete your account, bookmarks, highlights, notes, and subscription access. This cannot be undone.
            </p>

            <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
              Type <span className="font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={deleting}
              autoComplete="off"
              className="w-full rounded-lg px-3 py-2 text-[15px] mb-4 outline-none"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />

            {deleteError && (
              <p className="text-[13px] mb-3" style={{ color: "#DC2626" }}>
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 rounded-lg px-4 py-2.5 text-[15px] font-medium transition-colors active:opacity-70 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="flex-1 rounded-lg px-4 py-2.5 text-[15px] font-medium text-white transition-colors active:opacity-70 disabled:opacity-50"
                style={{
                  backgroundColor: deleteConfirmText === "DELETE" ? "#DC2626" : "#9CA3AF",
                }}
              >
                {deleting ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slider thumb styles */}
      <style jsx global>{`
        .settings-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent, #7c5cfc);
          cursor: pointer;
          border: 3px solid var(--background);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .settings-range::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent, #7c5cfc);
          cursor: pointer;
          border: 3px solid var(--background);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
