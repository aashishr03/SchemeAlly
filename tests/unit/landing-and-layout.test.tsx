import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import LandingPage from "@/app/(public)/page";

const authMocks = vi.hoisted(() => ({
  user: null as {
    id: string;
    email: string | null;
    displayName: string | null;
  } | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/components/auth/AuthSessionProvider", () => ({
  useAuthSession: () => ({
    user: authMocks.user,
    isTransitioning: false,
  }),
}));

describe("Phase 1 — Layout, Navigation, and Landing Page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    authMocks.user = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders floating Navbar with main navigation items and switches between English and Tamil", () => {
    render(
      <LanguageProvider>
        <Navbar />
      </LanguageProvider>
    );

    expect(screen.getByText("SchemeAlly")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.getByText("My Opportunities")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("AI Ally")).toBeInTheDocument();

    const langButton = screen.getByRole("button", {
      name: /Switch language between English and Tamil/i,
    });
    fireEvent.click(langButton);

    expect(screen.getByText("முகப்பு")).toBeInTheDocument();
    expect(screen.getByText("திட்டங்களைத் தேடு")).toBeInTheDocument();
    expect(screen.getByText("எனது வாய்ப்புகள்")).toBeInTheDocument();
    expect(screen.getByText("சேமித்தவை")).toBeInTheDocument();
    expect(screen.getByText("AI தோழன்")).toBeInTheDocument();
  });

  it("renders LandingPage with all required sections and zero fabricated demo data", () => {
    const { container } = render(
      <LanguageProvider>
        <LandingPage />
        <Footer />
      </LanguageProvider>
    );

    // Hero headline and CTAs
    expect(screen.getByText(/Find the government benefits/i)).toBeInTheDocument();
    expect(screen.getByText(/that fit you\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/Check My Opportunities/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Explore Schemes/i)).toBeInTheDocument();

    // Categories & Trust Pillars
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Agriculture")).toBeInTheDocument();
    expect(screen.getByText("Your privacy matters")).toBeInTheDocument();
    expect(screen.getByText("Explainable by design")).toBeInTheDocument();
    expect(screen.getByText("Ready for action")).toBeInTheDocument();

    // Readiness formula & AI Ally
    expect(screen.getByText("Deterministic Eligibility Engine")).toBeInTheDocument();
    expect(screen.getByText("Application Readiness Tracker")).toBeInTheDocument();
    expect(screen.getByText("Open AI Ally")).toBeInTheDocument();

    // Ensure no fabricated screenshot demo claims are hardcoded
    expect(container.textContent).not.toContain("National Merit Scholarship");
    expect(container.textContent).not.toContain("92% match");
    expect(container.textContent).not.toContain("3 potential opportunities");
  });

  it("routes the missing-profile CTA to /profile while keeping opportunity CTAs separate", () => {
    render(
      <LanguageProvider>
        <LandingPage />
      </LanguageProvider>
    );

    expect(
      screen.getByRole("link", { name: "Complete My Profile" })
    ).toHaveAttribute("href", "/profile");
    expect(
      screen
        .getAllByRole("link", { name: "Check My Opportunities" })
        .every((link) => link.getAttribute("href") === "/opportunities")
    ).toBe(true);
  });

  it("shows the profile update CTA when the signed-in user's eligibility profile is complete", async () => {
    authMocks.user = {
      id: "citizen-1",
      email: "citizen@example.test",
      displayName: "Citizen",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          completion: { isOnboardingComplete: true },
        }),
      })
    );

    render(
      <LanguageProvider>
        <LandingPage />
      </LanguageProvider>
    );

    expect(
      await screen.findByRole("link", { name: "Update My Profile" })
    ).toHaveAttribute("href", "/profile");
  });

  it("keeps the profile completion CTA for an incomplete signed-in eligibility profile", async () => {
    authMocks.user = {
      id: "citizen-1",
      email: "citizen@example.test",
      displayName: "Citizen",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          completion: { isOnboardingComplete: false },
        }),
      })
    );

    render(
      <LanguageProvider>
        <LandingPage />
      </LanguageProvider>
    );

    expect(
      await screen.findByRole("link", { name: "Complete My Profile" })
    ).toHaveAttribute("href", "/profile");
  });
});
