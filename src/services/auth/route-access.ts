export const PROTECTED_CITIZEN_PATH_PREFIXES = [
  "/dashboard",
  "/opportunities",
  "/profile",
  "/documents",
  "/saved",
  "/applications",
  "/assistant",
  "/settings",
] as const;

export const AUTH_GUEST_ONLY_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
] as const;

export function isProtectedCitizenRoute(pathname: string): boolean {
  return PROTECTED_CITIZEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isGuestOnlyAuthRoute(pathname: string): boolean {
  return AUTH_GUEST_ONLY_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
