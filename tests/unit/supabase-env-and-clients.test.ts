// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  EnvironmentConfigurationError,
  getAppUrlEnv,
  getPublicSupabaseEnv,
  isSupabaseConfigured,
} from "@/infrastructure/supabase/env";
import { getServiceRoleSupabaseEnv } from "@/infrastructure/supabase/admin-env";
import {
  createServiceRoleSupabaseClient,
  type PrivilegedOperationPurpose,
} from "@/infrastructure/supabase/admin";
import {
  getAuthenticatedServerUser,
  requireAuthenticatedServerUser,
  UnauthorizedError,
} from "@/infrastructure/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

describe("Phase 2 — Supabase Environment Validation & Privileged Client Isolation", () => {
  const validEnv = {
    NEXT_PUBLIC_SUPABASE_URL: "https://exampleproject.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key_12345",
    SUPABASE_SERVICE_ROLE_KEY: "sb_secret_service_role_key_67890",
    NEXT_PUBLIC_APP_URL: "https://schemeally.vercel.app/",
  };

  it("validates public Supabase environment variables and trims trailing slashes on app URL", () => {
    const publicEnv = getPublicSupabaseEnv(validEnv);
    expect(publicEnv.url).toBe("https://exampleproject.supabase.co");
    expect(publicEnv.publishableKey).toBe("sb_publishable_test_key_12345");
    expect(isSupabaseConfigured(validEnv)).toBe(true);
    expect(getAppUrlEnv(validEnv)).toBe("https://schemeally.vercel.app");
  });

  it("uses the statically referenced public environment values by default", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://exampleproject.supabase.co"
    );
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_test_key_12345"
    );

    try {
      expect(isSupabaseConfigured()).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("supports NEXT_PUBLIC_SUPABASE_ANON_KEY fallback when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is omitted", () => {
    const fallbackEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "https://exampleproject.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJ_anon_fallback_key",
    };
    const publicEnv = getPublicSupabaseEnv(fallbackEnv);
    expect(publicEnv.publishableKey).toBe("eyJ_anon_fallback_key");
  });

  it("throws descriptive EnvironmentConfigurationError when variables are missing or invalid", () => {
    expect(() => getPublicSupabaseEnv({})).toThrowError(
      EnvironmentConfigurationError
    );

    try {
      getPublicSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-valid-url",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      });
    } catch (err) {
      expect(err).toBeInstanceOf(EnvironmentConfigurationError);
      const configErr = err as EnvironmentConfigurationError;
      expect(configErr.missingOrInvalidVars).toContain(
        "NEXT_PUBLIC_SUPABASE_URL"
      );
      expect(configErr.missingOrInvalidVars).toContain(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      );
      expect(configErr.message).toContain(".env.local");
    }
  });

  it("validates SUPABASE_SERVICE_ROLE_KEY and rejects identical public/service-role keys", () => {
    const serviceEnv = getServiceRoleSupabaseEnv(validEnv);
    expect(serviceEnv.serviceRoleKey).toBe("sb_secret_service_role_key_67890");

    expect(() =>
      getServiceRoleSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://exampleproject.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "same_key",
        SUPABASE_SERVICE_ROLE_KEY: "same_key",
      })
    ).toThrow(/must not be identical/i);
  });

  it("blocks service-role client creation in browser context or with unauthorized purpose", () => {
    // Reject unauthorized purpose
    expect(() =>
      createServiceRoleSupabaseClient(
        "ordinary_citizen_request" as unknown as PrivilegedOperationPurpose,
        validEnv
      )
    ).toThrow(/SECURITY VIOLATION: Invalid or unauthorized privileged client purpose/i);

    // Reject browser context if window is present
    const g = globalThis as unknown as { window?: unknown };
    g.window = {};
    try {
      expect(() => getServiceRoleSupabaseEnv(validEnv)).toThrow(
        /SECURITY VIOLATION/i
      );
      expect(() =>
        createServiceRoleSupabaseClient("system_seed_or_migration", validEnv)
      ).toThrow(/SECURITY VIOLATION/i);
    } finally {
      delete g.window;
    }

    // Succeeds in server context with authorized purpose
    const adminClient = createServiceRoleSupabaseClient(
      "system_seed_or_migration",
      validEnv
    );
    expect(adminClient).toBeDefined();
  });

  it("derives citizen identity strictly from verified server auth.getUser()", async () => {
    const mockUser = { id: "11111111-1111-4111-8111-111111111111", email: "citizen@example.com" };
    const authenticatedClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    } as unknown as SupabaseClient<Database>;

    const user = await requireAuthenticatedServerUser(authenticatedClient);
    expect(user.id).toBe(mockUser.id);

    const unauthenticatedClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("Invalid JWT"),
        }),
      },
    } as unknown as SupabaseClient<Database>;

    expect(await getAuthenticatedServerUser(unauthenticatedClient)).toBeNull();
    await expect(
      requireAuthenticatedServerUser(unauthenticatedClient)
    ).rejects.toThrowError(UnauthorizedError);
  });
});
