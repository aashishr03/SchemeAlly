import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getServiceRoleSupabaseEnv } from "./admin-env";

/**
 * Explicit whitelist of privileged administrative operations.
 * Ordinary citizen requests MUST NEVER use the service-role client;
 * they must use `createServerSupabaseClient()` so RLS policies are enforced.
 */
export type PrivilegedOperationPurpose =
  | "system_seed_or_migration"
  | "knowledge_embedding_indexing";

const ALLOWED_PURPOSES: ReadonlySet<PrivilegedOperationPurpose> = new Set([
  "system_seed_or_migration",
  "knowledge_embedding_indexing",
]);

/**
 * Creates a server-only privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Guarded by `server-only`, runtime window check, and an explicit purpose check.
 */
export function createServiceRoleSupabaseClient(
  purpose: PrivilegedOperationPurpose,
  envSource: Record<string, string | undefined> = process.env
) {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: Service-role client cannot be instantiated in a browser environment."
    );
  }

  if (!ALLOWED_PURPOSES.has(purpose)) {
    throw new Error(
      `SECURITY VIOLATION: Invalid or unauthorized privileged client purpose "${String(
        purpose
      )}". Use createServerSupabaseClient() with RLS for citizen requests.`
    );
  }

  const { url, serviceRoleKey } = getServiceRoleSupabaseEnv(envSource);

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
