import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/profile", "/learn", "/admin"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const needsAuth = PROTECTED.some((p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + "/"));
  if (!url || !key) {
    // Not configured yet: protected pages cannot work, public pages still render.
    return needsAuth ? NextResponse.redirect(new URL("/onboarding?error=not_configured", request.url)) : response;
  }
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Validates the JWT and refreshes the session cookie. Real authorization is re-checked
  // in server components / route handlers and enforced by RLS; this is only an optimistic gate.
  const { data } = await supabase.auth.getClaims();
  if (needsAuth && !data?.claims) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
