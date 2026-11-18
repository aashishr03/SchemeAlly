import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnv, isSupabaseConfigured } from "./env";
import { sanitizeRedirectPath } from "@/services/auth/schema";
import {
  isGuestOnlyAuthRoute,
  isProtectedCitizenRoute,
} from "@/services/auth/route-access";

export {
  AUTH_GUEST_ONLY_PATHS,
  PROTECTED_CITIZEN_PATH_PREFIXES,
  isGuestOnlyAuthRoute,
  isProtectedCitizenRoute,
} from "@/services/auth/route-access";

function redirectWithAuthCookies(
  source: NextResponse,
  url: URL,
  privateRoute: boolean
): NextResponse {
  const response = NextResponse.redirect(url);
  for (const cookie of source.cookies.getAll()) {
    response.cookies.set(cookie);
  }
  if (privateRoute) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate"
    );
  }
  return response;
}

/**
 * Refreshes the user's Supabase Auth session cookies on incoming requests
 * and enforces protected route redirects.
 */
export async function updateSupabaseSession(
  request: NextRequest
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const { url, publishableKey } = getPublicSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({
          request,
        });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Always use getUser() to revalidate the Auth token with Supabase Auth server
  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;

  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedCitizenRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return redirectWithAuthCookies(
      supabaseResponse,
      loginUrl,
      isProtectedCitizenRoute(pathname)
    );
  }

  if (user && isGuestOnlyAuthRoute(pathname)) {
    const targetUrl = new URL(
      sanitizeRedirectPath(
        request.nextUrl.searchParams.get("next"),
        "/dashboard"
      ),
      request.nextUrl.origin
    );
    return redirectWithAuthCookies(supabaseResponse, targetUrl, false);
  }

  if (isProtectedCitizenRoute(pathname)) {
    supabaseResponse.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate"
    );
  }

  return supabaseResponse;
}
