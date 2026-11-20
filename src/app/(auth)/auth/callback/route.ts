import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { sanitizeRedirectPath } from "@/services/auth/schema";

function redirectToNext(
  origin: string,
  next: string,
  emailVerified = false
) {
  const destination = new URL(next, origin);
  if (emailVerified) {
    destination.searchParams.set("email_verified", "1");
  }
  return NextResponse.redirect(destination);
}

function logCallbackFailure(
  stage: string,
  error: unknown,
  hasCodeVerifierCookie: boolean
) {
  const details =
    typeof error === "object" && error !== null
      ? (error as { name?: unknown; code?: unknown; status?: unknown })
      : {};
  const errorName =
    typeof details.name === "string" &&
    /^[A-Za-z0-9_]{1,64}$/.test(details.name)
      ? details.name
      : "UnknownError";
  const errorCode =
    typeof details.code === "string" &&
    /^[A-Za-z0-9_-]{1,64}$/.test(details.code)
      ? details.code
      : undefined;

  console.error("[auth/callback] Authentication callback failed", {
    stage,
    errorName,
    errorCode,
    errorStatus:
      typeof details.status === "number" ? details.status : undefined,
    hasCodeVerifierCookie,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirectPath(searchParams.get("next"), "/dashboard");
  const hasProviderError = ["error", "error_code", "error_description"].some(
    (key) => searchParams.has(key)
  );
  const hasCodeVerifierCookie = request.cookies
    .getAll()
    .some(({ name }) => name.endsWith("-code-verifier"));

  const supabase = await createServerSupabaseClient();
  let sessionChecked = false;
  let hasAuthenticatedSession = false;
  let sessionError: unknown;

  const checkSession = async () => {
    if (!sessionChecked) {
      const { data, error } = await supabase.auth.getUser();
      sessionChecked = true;
      hasAuthenticatedSession = Boolean(data.user && !error);
      sessionError = error;
    }
    return hasAuthenticatedSession;
  };

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      if (!hasProviderError && (await checkSession())) {
        return redirectToNext(origin, next);
      }
      logCallbackFailure("code_exchange", error, hasCodeVerifierCookie);
    } else if (await checkSession()) {
      return redirectToNext(origin, next, next === "/profile");
    } else {
      logCallbackFailure(
        "session_validation",
        sessionError ?? new Error("Authenticated session missing after code exchange"),
        hasCodeVerifierCookie
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      if (!hasProviderError && (await checkSession())) {
        return redirectToNext(
          origin,
          type === "recovery" ? "/reset-password" : next
        );
      }
      logCallbackFailure("otp_verification", error, hasCodeVerifierCookie);
    } else if (await checkSession()) {
      if (type === "recovery") {
        return redirectToNext(origin, "/reset-password");
      }
      return redirectToNext(origin, next, next === "/profile");
    } else {
      logCallbackFailure(
        "session_validation",
        sessionError ?? new Error("Authenticated session missing after OTP verification"),
        hasCodeVerifierCookie
      );
    }
  }

  if (!hasProviderError && (await checkSession())) {
    return redirectToNext(origin, next);
  }

  if (hasProviderError) {
    console.error("[auth/callback] Provider rejected authentication callback", {
      hasCode: Boolean(code),
      hasTokenHash: Boolean(tokenHash),
      hasCodeVerifierCookie,
    });
  } else if (!code && !(tokenHash && type)) {
    console.error("[auth/callback] Callback did not include a usable credential", {
      hasCode: Boolean(code),
      hasTokenHash: Boolean(tokenHash),
      hasOtpType: Boolean(type),
      hasCodeVerifierCookie,
    });
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth_callback_failed");
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
