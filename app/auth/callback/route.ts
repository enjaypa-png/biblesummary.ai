import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /auth/callback
 *
 * Receives the OAuth redirect from Supabase and forwards the auth code
 * to the client-side /auth/complete page where the localStorage-based
 * Supabase client handles the PKCE exchange.
 *
 * Why client-side?  Safari ITP strips cookies set via document.cookie
 * during cross-site redirect chains, which breaks the cookie-based PKCE
 * verifier.  The localStorage-based client is immune to ITP.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Forward the code to the client-side page for localStorage-based exchange.
  return NextResponse.redirect(
    `${origin}/auth/complete?code=${encodeURIComponent(code)}`
  );
}
