import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

/**
 * Safari drops Set-Cookie headers on 302 redirect responses (ITP).
 * Return an HTML page that lets cookies land, then redirect via JS.
 */
function htmlRedirect(
  url: string,
  cookies: { name: string; value: string; options: CookieOptions }[]
) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${url}">
<script>window.location.href="${url}";</script>
</head><body></body></html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Collect cookies that Supabase auth needs to set on the response
  const cookiesToReturn: { name: string; value: string; options: CookieOptions }[] = [];

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookiesToReturn.push({ name, value, options });
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let redirectUrl = `${origin}/bible`;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed_at")
          .eq("user_id", user.id)
          .single();
        if (!profile?.onboarding_completed_at) {
          redirectUrl = `${origin}/onboarding`;
        }
      }

      // Use HTML redirect so Safari processes Set-Cookie headers
      return htmlRedirect(redirectUrl, cookiesToReturn);
    }
  }

  // Pass error context so the login page can show a message
  const loginUrl = new URL("/login", origin);
  if (code) {
    loginUrl.searchParams.set("error", "oauth_exchange_failed");
  }
  return NextResponse.redirect(loginUrl.toString());
}
