"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut, supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

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
      case "premium_yearly": return "Premium";
      default: return type;
    }
  }

  function getSubscriptionPrice(type: string): string {
    switch (type) {
      case "explain_monthly": return "$4.99/mo";
      case "summary_annual": return "$14.99/yr";
      case "premium_yearly": return "$59/yr";
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
          More
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
                    Bible & audio free
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

              {cancelError && (
                <div className="px-4 py-2" style={{ borderTop: "0.5px solid var(--border)" }}>
                  <p className="text-[13px]" style={{ color: "var(--error)" }}>
                    {cancelError}
                  </p>
                </div>
              )}
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
              ClearBible.ai helps you read, listen to, and finish the entire Bible—without losing track of where you are or what you&apos;ve already read.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              Two versions are available: the King James Version (KJV) and the Clear Bible Translation, a modern English rendering currently being reviewed for accuracy against the KJV. Switch between them anytime in Reading Settings.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              Bible text and audio are always free. We offer optional AI-generated book summaries designed to help you retain what you read, understand the structure of each book, and return to Scripture with clarity instead of starting over.
            </p>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--secondary)" }}>
              ClearBible.ai is an educational reading tool. It does not provide spiritual counseling, religious advice, or interpretive theology. Summaries describe what each book contains without interpretation.
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
