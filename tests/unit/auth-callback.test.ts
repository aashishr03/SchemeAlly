// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/infrastructure/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      verifyOtp: mocks.verifyOtp,
      getUser: mocks.getUser,
    },
  })),
}));

import { GET } from "@/app/(auth)/auth/callback/route";

const origin = "https://schemeally.vercel.app";

describe("Supabase authentication callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects successful email verification to the profile with a success marker", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: {} },
      error: null,
    });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "verified-user" } },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        `${origin}/auth/callback?code=confirmation-code&next=%2Fprofile`
      )
    );

    const location = new URL(response.headers.get("location")!);
    expect(location.origin).toBe(origin);
    expect(location.pathname).toBe("/profile");
    expect(location.searchParams.get("email_verified")).toBe("1");
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith(
      "confirmation-code"
    );
    expect(mocks.getUser).toHaveBeenCalledOnce();
  });

  it("shows a genuine expired-link error when exchange fails and no session exists", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: new Error("expired"),
    });
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        `${origin}/auth/callback?code=expired-code&next=%2Fprofile`
      )
    );

    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth_callback_failed");
    expect(location.searchParams.get("next")).toBe("/profile");
  });

  it("logs only safe diagnostics when the PKCE verifier is missing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: {
        name: "AuthPKCECodeVerifierMissingError",
        code: "pkce_code_verifier_not_found",
        status: 400,
      },
    });
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("session missing"),
    });

    const response = await GET(
      new NextRequest(
        `${origin}/auth/callback?code=private-auth-code&next=%2Fprofile`,
        {
          headers: {
            cookie:
              "sb-project-auth-token-code-verifier=private-code-verifier",
          },
        }
      )
    );

    expect(response.headers.get("location")).toContain("/login?");
    expect(log).toHaveBeenCalledWith(
      "[auth/callback] Authentication callback failed",
      expect.objectContaining({
        stage: "code_exchange",
        errorName: "AuthPKCECodeVerifierMissingError",
        errorCode: "pkce_code_verifier_not_found",
        errorStatus: 400,
        hasCodeVerifierCookie: true,
      })
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-auth-code");
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "private-code-verifier"
    );
    log.mockRestore();
  });

  it("does not report a callback error when a repeated callback already has a valid session", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: new Error("code already exchanged"),
    });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "verified-user" } },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        `${origin}/auth/callback?code=replayed-code&next=%2Fprofile`
      )
    );

    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/profile");
    expect(location.searchParams.has("error")).toBe(false);
    expect(location.searchParams.get("email_verified")).toBeNull();
  });

  it("does not suppress an explicit Supabase callback error", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "existing-user" } },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        `${origin}/auth/callback?error=access_denied&error_code=otp_expired&next=%2Fprofile`
      )
    );

    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth_callback_failed");
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});
