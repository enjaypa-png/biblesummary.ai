"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut, supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import BrandName from "@/components/BrandName";
import { useReadingSettings } from "@/contexts/ReadingSettingsContext";

interface Subscription {
  type: string;
  status: string;
  current_period_end: string;
}

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
  const router = useRouter();
  const { openPanel } = useReadingSettings();

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

      // Update local state
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

      // Sign out locally and redirect
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
          Settings &amp; More
        </h1>
      </header>
      <main className="max-w-lg mx-auto px-5 py-6">
        {/* Account */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-2 px-1"
            style={{ color: "var(--secondary)" }}>
            Account
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            {loading ? (
              <div className="px-4 py-3" style={{ color: "var(--secondary)" }}>
                <span className="text-[14px]">Loading…</span>
              </div>
            ) : !user ? (
              unauthenticatedMenuItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-4 py-3 transition-colors active:bg-black/5 dark:active:bg-white/5"
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
                <div className="px-4 py-3" style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
                    Email
                  </span>
                  <p className="text-[15px] mt-1 truncate" style={{ color: "var(--foreground)" }} title={user.email ?? undefined}>
                    {user.email ?? "—"}
                  </p>
                </div>
                <div className="px-4 py-3" style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
                    Status
                  </span>
                  <p className="text-[15px] mt-1" style={{ color: "var(--foreground)" }}>
                    {subscriptions.some((s) => s.status === "active")
                      ? "AI features (Bible Search, explanations, summaries) are active for your account."
                      : "Bible text is free. AI features (Bible Search, explanations, summaries) are available with upgrade."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors active:bg-black/5 dark:active:bg-white/5 text-left"
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

        {/* Reading Settings */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-2 px-1"
            style={{ color: "var(--secondary)" }}>
            Reading Settings
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <button
              type="button"
              onClick={openPanel}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors active:bg-black/5 dark:active:bg-white/5 text-left"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" style={{ color: "var(--accent, #7c5cfc)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <div>
                  <span className="font-medium text-[15px]" style={{ color: "var(--foreground)" }}>
                    Translation, Font, Theme &amp; Voice
                  </span>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--secondary)" }}>
                    Background color, text size, narrator voice, and more
                  </p>
                </div>
              </div>
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path d="M1 1L5 5L1 9" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </section>

        {/* Subscriptions — only show for authenticated users with subscriptions */}
        {user && subscriptions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-2 px-1"
              style={{ color: "var(--secondary)" }}>
              Subscriptions
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
              {subscriptions.map((sub, i) => (
                <div
                  key={sub.type}
                  className="px-4 py-3"
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
                className="w-full flex items-center justify-between px-4 py-3 transition-colors active:bg-black/5 dark:active:bg-white/5 text-left disabled:opacity-50"
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

        {/* About */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-2 px-1"
            style={{ color: "var(--secondary)" }}>
            About
          </h2>
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <p className="text-[14px] leading-relaxed mb-3" style={{ color: "var(--foreground)" }}>
              <BrandName /> helps you read, listen to, search, and finish the entire Bible without losing track of where you are or what you&apos;ve already read.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              You can also ask ClearBible’s AI questions about the Bible and instantly see the verses that answer them.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              Two versions are available: the King James Version (KJV) and the Clear Bible Translation, a modern English rendering currently being reviewed for accuracy against the KJV. Switch between them anytime in Reading Settings.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              Bible text and audio are always free. We offer optional AI-powered features designed to help you retain what you read, understand the structure of each book, and return to Scripture with clarity instead of starting over.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              <BrandName /> is an educational reading tool. It does not provide spiritual counseling, religious advice, or interpretive theology. Summaries describe what each book contains without interpretation.
            </p>
            <p className="text-[13px] font-medium" style={{ color: "var(--secondary)" }}>
              No ads. No opinions.
            </p>
          </div>
        </section>

        {/* Legal */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-2 px-1"
            style={{ color: "var(--secondary)" }}>
            Legal
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
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

        {/* Danger Zone — only show for authenticated users */}
        {user && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-2 px-1"
              style={{ color: "#DC2626" }}>
              Danger Zone
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(220, 38, 38, 0.3)" }}>
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
    </div>
  );
}
