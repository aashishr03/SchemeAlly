import { z } from "zod";

export class EnvironmentConfigurationError extends Error {
  public readonly missingOrInvalidVars: string[];

  constructor(message: string, missingOrInvalidVars: string[]) {
    super(message);
    this.name = "EnvironmentConfigurationError";
    this.missingOrInvalidVars = missingOrInvalidVars;
  }
}

const PublicSupabaseEnvSchema = z.object({
  url: z
    .string({
      required_error: "NEXT_PUBLIC_SUPABASE_URL is required",
    })
    .trim()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL cannot be empty")
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. https://<project-ref>.supabase.co)"),
  publishableKey: z
    .string({
      required_error: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required",
    })
    .trim()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY cannot be empty"),
});

export interface PublicSupabaseEnv {
  url: string;
  publishableKey: string;
}

/**
 * Validates and returns the public Supabase URL and publishable/anon key.
 * Safe for both browser and server contexts.
 */
export function getPublicSupabaseEnv(
  envSource: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
): PublicSupabaseEnv {
  const rawUrl = envSource.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey =
    envSource.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const parsed = PublicSupabaseEnvSchema.safeParse({
    url: rawUrl,
    publishableKey: rawKey,
  });

  if (!parsed.success) {
    const fieldIssues = parsed.error.issues.map((issue) => {
      const varName =
        issue.path[0] === "url"
          ? "NEXT_PUBLIC_SUPABASE_URL"
          : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
      return `${varName}: ${issue.message}`;
    });
    const missingVars = parsed.error.issues.map((issue) =>
      issue.path[0] === "url"
        ? "NEXT_PUBLIC_SUPABASE_URL"
        : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );

    throw new EnvironmentConfigurationError(
      `Missing or invalid Supabase environment configuration (${fieldIssues.join(
        "; "
      )}). Please configure these variables in your .env.local file (see .env.example).`,
      Array.from(new Set(missingVars))
    );
  }

  return parsed.data;
}

/**
 * Returns true if public Supabase environment variables are configured and valid.
 */
export function isSupabaseConfigured(
  envSource?: Record<string, string | undefined>
): boolean {
  try {
    getPublicSupabaseEnv(envSource);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates and returns the application base URL.
 */
export function getAppUrlEnv(
  envSource: Record<string, string | undefined> = process.env
): string {
  const raw = envSource.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    return "http://localhost:3000";
  }
  const parsed = z.string().url().safeParse(raw);
  if (!parsed.success) {
    throw new EnvironmentConfigurationError(
      "NEXT_PUBLIC_APP_URL must be a valid URL (e.g. http://localhost:3000).",
      ["NEXT_PUBLIC_APP_URL"]
    );
  }
  return parsed.data.replace(/\/+$/, "");
}
