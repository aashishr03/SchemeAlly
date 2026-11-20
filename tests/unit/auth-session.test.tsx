import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { AuthenticatedAppShell } from "@/components/layout/AuthenticatedAppShell";
import { Navbar } from "@/components/layout/Navbar";
import { useSavedSchemes } from "@/components/schemes/SavedSchemesProvider";
import LoginPage from "@/app/(auth)/login/page";

const mocks = vi.hoisted(() => ({
  pathname: "/discover",
  search: "",
  configured: true,
  authListener: null as
    | ((event: string, session: unknown) => void)
    | null,
  replace: vi.fn(),
  refresh: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
  signInWithPassword: vi.fn(),
  resend: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({
    replace: mocks.replace,
    push: vi.fn(),
    refresh: mocks.refresh,
  }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));

vi.mock("@/infrastructure/supabase/env", () => ({
  isSupabaseConfigured: () => mocks.configured,
}));

vi.mock("@/infrastructure/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      onAuthStateChange: (
        listener: (event: string, session: unknown) => void
      ) => {
        mocks.authListener = listener;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      },
      getUser: mocks.getUser,
      signOut: mocks.signOut,
      signInWithPassword: mocks.signInWithPassword,
      resend: mocks.resend,
    },
  }),
}));

const USER_A = {
  id: "user-a",
  email: "alice@example.test",
  user_metadata: { full_name: "Alice" },
};
const USER_B = {
  id: "user-b",
  email: "bob@example.test",
  user_metadata: { full_name: "Bob" },
};

function authSessionUser(user: typeof USER_A) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.user_metadata.full_name,
  };
}

function renderWithSession(
  children: React.ReactNode,
  initialUser: ReturnType<typeof authSessionUser> | null = null
) {
  return render(
    <LanguageProvider>
      <AuthSessionProvider initialUser={initialUser}>
        {children}
      </AuthSessionProvider>
    </LanguageProvider>
  );
}

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

function SavedNames() {
  const { items } = useSavedSchemes();
  return (
    <p>
      {items.map((item) => item.scheme.name_en).join(",")}
    </p>
  );
}

describe("authentication session flow", () => {
  beforeEach(() => {
    mocks.pathname = "/discover";
    mocks.search = "";
    mocks.configured = true;
    mocks.authListener = null;
    vi.clearAllMocks();
    mocks.getUser.mockReturnValue(new Promise(() => {}));
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.resend.mockResolvedValue({ error: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ savedSchemes: [] })));
    window.localStorage.clear();
    document.body.style.visibility = "";
  });

  it("shows sign-in and registration actions when signed out", async () => {
    renderWithSession(<Navbar />);

    expect(
      screen.getByRole("link", { name: "Sign in" })
    ).toHaveAttribute("href", "/login?next=%2Fdiscover");
    expect(
      screen.getByRole("link", { name: "Create citizen account" })
    ).toHaveAttribute("href", "/register");
    await waitFor(() => expect(mocks.getUser).toHaveBeenCalled());
  });

  it("shows the current user's name and sign-out action when signed in", () => {
    renderWithSession(<Navbar />, authSessionUser(USER_A));

    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute(
      "href",
      "/profile"
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("shows a callback error once and removes the stale error query parameter", async () => {
    mocks.pathname = "/login";
    mocks.search = "error=auth_callback_failed&next=%2Fprofile";

    renderWithSession(<LoginPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't complete sign-in from that verification link."
    );
    expect(mocks.replace).toHaveBeenCalledWith("/login?next=%2Fprofile");
  });

  it("allows a user to request a new confirmation email after callback failure", async () => {
    mocks.pathname = "/login";
    mocks.search = "error=auth_callback_failed&next=%2Fprofile";

    renderWithSession(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "citizen@example.test" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Resend confirmation email" })
    );

    expect(mocks.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "citizen@example.test",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If this email has an unverified account, a new confirmation email is on its way."
    );
  });

  it("completes sign-in and replaces history with the intended destination", async () => {
    mocks.pathname = "/login";
    mocks.search = "next=%2Fsaved";
    mocks.signInWithPassword.mockImplementation(async () => {
      mocks.authListener?.("SIGNED_IN", { user: USER_A });
      return { error: null };
    });

    renderWithSession(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: USER_A.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secure-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/saved"));
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: USER_A.email,
      password: "secure-password",
    });
  });

  it("completes sign-out through the server before clearing the local session", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls.push("server");
        return response({ ok: true });
      })
    );
    mocks.pathname = "/dashboard";
    mocks.signOut.mockImplementation(async () => {
      calls.push("browser");
      act(() => mocks.authListener?.("SIGNED_OUT", null));
      return { error: null };
    });

    renderWithSession(<Navbar />, authSessionUser(USER_A));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenLastCalledWith("/login")
    );
    expect(calls).toEqual(["server", "browser"]);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("supports login, refresh, navigation, sign-out, and a second login in sequence", async () => {
    mocks.pathname = "/login";
    mocks.search = "next=%2Fdashboard";
    mocks.signInWithPassword.mockImplementation(async () => {
      mocks.authListener?.("SIGNED_IN", { user: USER_A });
      return { error: null };
    });
    mocks.signOut.mockImplementation(async () => {
      mocks.authListener?.("SIGNED_OUT", null);
      return { error: null };
    });

    const renderFlow = (
      initialUser: ReturnType<typeof authSessionUser> | null,
      content: React.ReactNode
    ) => (
      <LanguageProvider>
        <AuthSessionProvider initialUser={initialUser}>
          {content}
        </AuthSessionProvider>
      </LanguageProvider>
    );
    const view = render(renderFlow(null, <LoginPage />));

    const submitLogin = () => {
      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: USER_A.email },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "secure-password" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    };

    submitLogin();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/dashboard"));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);

    mocks.pathname = "/dashboard";
    view.rerender(
      renderFlow(
        authSessionUser(USER_A),
        <AuthenticatedAppShell>
          <p>Dashboard for Alice</p>
        </AuthenticatedAppShell>
      )
    );
    expect(await screen.findByText("Dashboard for Alice")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();

    mocks.pathname = "/profile";
    view.rerender(
      renderFlow(
        authSessionUser(USER_A),
        <AuthenticatedAppShell>
          <p>Profile for Alice</p>
        </AuthenticatedAppShell>
      )
    );
    expect(await screen.findByText("Profile for Alice")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        "/login?next=%2Fprofile"
      )
    );
    expect(screen.queryByText("Profile for Alice")).not.toBeInTheDocument();

    mocks.pathname = "/login";
    view.rerender(renderFlow(null, <LoginPage />));
    submitLogin();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledTimes(4));
    expect(mocks.replace).toHaveBeenLastCalledWith("/dashboard");
    expect(mocks.refresh).toHaveBeenCalledTimes(2);
  });

  it("restores the authenticated navbar from the browser session after refresh", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: USER_A },
      error: null,
    });

    renderWithSession(<Navbar />);

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("hides protected personal information immediately after sign-out", async () => {
    mocks.pathname = "/dashboard";
    mocks.getUser.mockResolvedValue({
      data: { user: USER_A },
      error: null,
    });

    renderWithSession(
      <AuthenticatedAppShell>
        <p>Alice private profile</p>
      </AuthenticatedAppShell>,
      authSessionUser(USER_A)
    );
    expect(await screen.findByText("Alice private profile")).toBeInTheDocument();

    act(() => mocks.authListener?.("SIGNED_OUT", null));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your session changed."
    );
    expect(screen.queryByText("Alice private profile")).not.toBeInTheDocument();
  });

  it("does not restore protected content on browser back after sign-out", async () => {
    mocks.pathname = "/dashboard";
    mocks.getUser.mockReturnValue(new Promise(() => {}));

    renderWithSession(
      <AuthenticatedAppShell>
        <p>Alice private profile</p>
      </AuthenticatedAppShell>,
      authSessionUser(USER_A)
    );
    await screen.findByText("Alice private profile");
    act(() => mocks.authListener?.("SIGNED_OUT", null));

    const pageHide = new Event("pagehide");
    Object.defineProperty(pageHide, "persisted", { value: true });
    act(() => window.dispatchEvent(pageHide));
    expect(document.body.style.visibility).toBe("hidden");

    const pageShow = new Event("pageshow");
    Object.defineProperty(pageShow, "persisted", { value: true });
    mocks.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    await act(async () => {
      window.dispatchEvent(pageShow);
      await Promise.resolve();
    });

    await waitFor(() => expect(mocks.getUser).toHaveBeenCalledTimes(1));
    expect(mocks.replace).toHaveBeenCalledWith(
      "/login?next=%2Fdashboard"
    );
    expect(document.body.style.visibility).toBe("");
    expect(screen.queryByText("Alice private profile")).not.toBeInTheDocument();
  });

  it("switches account state without showing the previous profile or saved schemes", async () => {
    mocks.pathname = "/saved";
    mocks.getUser.mockResolvedValue({ data: { user: USER_A }, error: null });
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          response({
            savedSchemes: [
              { scheme: { id: "scheme-a", name_en: "Alice saved scheme" } },
            ],
          })
        )
        .mockResolvedValueOnce(
          response({
            savedSchemes: [
              { scheme: { id: "scheme-b", name_en: "Bob saved scheme" } },
            ],
          })
        )
    );

    const renderForUser = (user: typeof USER_A, profileName: string) => (
      <LanguageProvider>
        <AuthSessionProvider initialUser={authSessionUser(user)}>
          <AuthenticatedAppShell>
            <p>{profileName} profile</p>
            <SavedNames />
          </AuthenticatedAppShell>
        </AuthSessionProvider>
      </LanguageProvider>
    );
    const view = render(renderForUser(USER_A, "Alice"));
    expect(await screen.findByText("Alice saved scheme")).toBeInTheDocument();

    act(() => mocks.authListener?.("SIGNED_IN", { user: USER_B }));

    expect(screen.queryByText("Alice profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Alice saved scheme")).not.toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalled();

    view.rerender(renderForUser(USER_B, "Bob"));
    expect(await screen.findByText("Bob saved scheme")).toBeInTheDocument();
    expect(screen.getByText("Bob profile")).toBeInTheDocument();
    expect(screen.queryByText("Alice saved scheme")).not.toBeInTheDocument();
  });
});
