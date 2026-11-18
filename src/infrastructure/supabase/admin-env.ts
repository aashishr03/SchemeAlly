import "server-only";
import { z } from "zod";
import {
  EnvironmentConfigurationError,
  getPublicSupabaseEnv,
  type PublicSupabaseEnv,
} from "./env";

const ServiceRoleKeySchema = z
  .string({
    required_error: "SUPABASE_SERVICE_ROLE_KEY is required",
  })
  .trim()
  .min(1, "SUPABASE_SERVICE_ROLE_KEY cannot be empty");

export interface ServiceRoleSupabaseEnv extends PublicSupabaseEnv {
  serviceRoleKey: string;
}

/**
 * Server-only validator for the privileged Supabase service-role key.
 * Verifies that SUPABASE_SERVICE_ROLE_KEY is present and distinct from the public key.
 */
export function getServiceRoleSupabaseEnv(
  envSource: Record<string, string | undefined> = process.env
): ServiceRoleSupabaseEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: Attempted to access SUPABASE_SERVICE_ROLE_KEY in a browser context."
    );
  }

  const publicEnv = getPublicSupabaseEnv(envSource);
  const parsedKey = ServiceRoleKeySchema.safeParse(
    envSource.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!parsedKey.success) {
    throw new EnvironmentConfigurationError(
      "Missing or invalid SUPABASE_SERVICE_ROLE_KEY. Configure SUPABASE_SERVICE_ROLE_KEY in your server environment (.env.local) and never expose it to the client.",
      ["SUPABASE_SERVICE_ROLE_KEY"]
    );
  }

  if (parsedKey.data === publicEnv.publishableKey) {
    throw new EnvironmentConfigurationError(
      "SECURITY ERROR: SUPABASE_SERVICE_ROLE_KEY must not be identical to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      ["SUPABASE_SERVICE_ROLE_KEY"]
    );
  }

  return {
    ...publicEnv,
    serviceRoleKey: parsedKey.data,
  };
}
