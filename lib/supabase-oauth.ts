import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

/**
 * A Supabase client that uses **localStorage** for auth storage.
 *
 * Used ONLY for the OAuth sign-in flow.  The default `createBrowserClient`
 * from `@supabase/ssr` stores the PKCE code_verifier in a cookie, which
 * Safari's Intelligent Tracking Prevention (ITP) can strip during the
 * cross-site redirect chain (app → Google → Supabase → app).
 *
 * `localStorage` is immune to ITP — it persists across same-origin
 * navigations regardless of cross-site redirects in between.
 *
 * After the OAuth exchange succeeds via this client, the session is
 * transferred to the cookie-based client (`lib/supabase.ts`) so that
 * server-side rendering and middleware can read it.
 */
export const supabaseOAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    // Auto-detect ?code= in the URL and exchange it using the verifier
    // stored in localStorage — this is the Safari-safe path.
    detectSessionInUrl: true,
    autoRefreshToken: false,
    // storageKey must match the default so signInWithOAuth on the login page
    // stores the verifier under the same key that the callback page reads.
    storageKey: `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token-oauth`,
  },
});
