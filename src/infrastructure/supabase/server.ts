import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnv } from "./env";

/**
 * Creates a request-scoped, user-authenticated Supabase client for Server Components,
 * Server Actions, and Route Handlers. All queries execute under PostgreSQL RLS.
 */
export async function createServerSupabaseClient(): Promise<
  SupabaseClient<Database>
> {
  const cookieStore = await cookies();
  const { url, publishableKey } = getPublicSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where response headers are already immutable.
          // Session refresh is handled in middleware.
        }
      },
    },
  }) as unknown as SupabaseClient<Database>;
}

/**
 * Derives the authenticated citizen's identity from the verified Supabase Auth server session.
 * Never trusts client-supplied user IDs or unverified cookie claims.
 */
export async function getAuthenticatedServerUser(
  client?: Pick<SupabaseClient<Database>, "auth">
): Promise<User | null> {
  const supabase = client ?? (await createServerSupabaseClient());
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

/**
 * Asserts that a verified server session exists and returns the authenticated User.
 * Throws an UnauthorizedError if no valid session is present.
 */
export class UnauthorizedError extends Error {
  public readonly statusCode = 401;

  constructor(message = "Authentication is required to access this resource.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireAuthenticatedServerUser(
  client?: Pick<SupabaseClient<Database>, "auth">
): Promise<User> {
  const user = await getAuthenticatedServerUser(client);
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
