import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/bible";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet_) {
          cookiesToSet_.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[OAuth callback] Exchange error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
  }

  // Check onboarding status
  const { data: { user } } = await supabase.auth.getUser();
  let redirectTo = `${origin}${next}`;

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed_at")
      .eq("user_id", user.id)
      .single();

    if (!profile?.onboarding_completed_at) {
      redirectTo = `${origin}/onboarding`;
    }
  }

  // Build response with cookies set
  const response = NextResponse.redirect(redirectTo);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
