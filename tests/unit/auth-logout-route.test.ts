import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { signOut: mocks.signOut },
  }),
}));

import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears only the current Supabase session and returns a non-cacheable success", async () => {
    mocks.signOut.mockResolvedValue({ error: null });

    const response = await POST();

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("reports server-side session clearing failures", async () => {
    mocks.signOut.mockResolvedValue({
      error: new Error("session revocation failed"),
    });

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Failed to sign out.",
    });
  });
});
