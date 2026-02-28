import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Forward the code to the client-side complete page
// which has access to localStorage where the PKCE verifier is stored
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    return NextResponse.redirect(`${origin}/auth/complete?code=${encodeURIComponent(code)}`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
