import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /auth/callback
 *
 * Handles the OAuth redirect from Supabase/Google.
 * Performs the PKCE code exchange SERVER-SIDE so that the code_verifier
 * cookie is read directly from the request — this avoids Safari ITP
 * stripping the cookie after the cross-site redirect chain.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Collect cookies that Supabase sets during the exchange
  // so we can apply them to the redirect response.
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((c) => pendingCookies.push(c));
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
  }

  // Determine redirect destination
  const { data: { user } } = await supabase.auth.getUser();
  const onboarded = user?.user_metadata?.onboarding_completed;
  const dest = onboarded ? "/bible" : "/onboarding";

  const response = NextResponse.redirect(`${origin}${dest}`);

  // Apply all auth cookies to the redirect response
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  return response;
}
