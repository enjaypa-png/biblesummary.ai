import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams, origin } = new URL(request.url);

  // If an OAuth code arrives on the wrong route (e.g. "/" instead of
  // "/auth/callback"), forward it to /auth/callback so the server-side
  // PKCE exchange can finish.  This happens when the Supabase dashboard
  // redirect-URL allowlist falls back to the site URL.
  const code = searchParams.get("code");
  if (
    code &&
    pathname !== "/auth/callback" &&
    pathname !== "/auth/complete"
  ) {
    return NextResponse.redirect(
      `${origin}/auth/callback?code=${encodeURIComponent(code)}`
    );
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this is the critical call that keeps
  // server-side cookies in sync with the Supabase auth state.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/complete|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
