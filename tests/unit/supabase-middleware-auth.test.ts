// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  refreshCookies: false,
}));

vi.mock("@/infrastructure/supabase/env", () => ({
  isSupabaseConfigured: () => true,
  getPublicSupabaseEnv: () => ({
    url: "https://example.supabase.co",
    publishableKey: "test-publishable-key",
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (
          cookies: {
            name: string;
            value: string;
            options: { path: string; httpOnly: boolean; sameSite: "lax" };
          }[]
        ) => void;
      };
    }
  ) => ({
    auth: {
      getUser: async () => {
        if (mocks.refreshCookies) {
          options.cookies.setAll([
            {
              name: "sb-project-auth-token",
              value: "refreshed-session",
              options: { path: "/", httpOnly: true, sameSite: "lax" },
            },
          ]);
        }
        return { data: { user: mocks.user }, error: null };
      },
    },
  }),
}));

import { updateSupabaseSession } from "@/infrastructure/supabase/middleware";

describe("Supabase middleware session behavior", () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.refreshCookies = false;
  });

  it("redirects signed-out visitors from protected pages to login", async () => {
    const response = await updateSupabaseSession(
      new NextRequest("http://localhost:3000/dashboard?tab=profile")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?tab=profile&next=%2Fdashboard%3Ftab%3Dprofile"
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("allows a signed-out email callback to reach its route handler", async () => {
    const response = await updateSupabaseSession(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=callback-code"
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("preserves refreshed session cookies in guest-route redirects and honors next", async () => {
    mocks.user = { id: "citizen-a" };
    mocks.refreshCookies = true;

    const response = await updateSupabaseSession(
      new NextRequest(
        "http://localhost:3000/login?next=%2Fprofile%3Ftab%3Dpersonal"
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/profile?tab=personal"
    );
    expect(response.headers.get("set-cookie")).toContain(
      "sb-project-auth-token=refreshed-session"
    );
  });

  it("marks authenticated private page responses as non-cacheable", async () => {
    mocks.user = { id: "citizen-a" };

    const response = await updateSupabaseSession(
      new NextRequest("http://localhost:3000/opportunities")
    );

    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0, must-revalidate"
    );
  });
});
