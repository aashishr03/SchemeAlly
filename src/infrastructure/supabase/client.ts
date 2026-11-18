import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnv } from "./env";

/**
 * Creates a user-scoped Supabase client for Client Components.
 * Uses only the public URL and publishable/anon key, never the service-role key.
 */
export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  const { url, publishableKey } = getPublicSupabaseEnv();
  return createBrowserClient<Database>(
    url,
    publishableKey
  ) as unknown as SupabaseClient<Database>;
}
