import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("server-only", () => ({}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

import {
  ForgotPasswordInputSchema,
  LoginInputSchema,
  RegisterInputSchema,
  ResetPasswordInputSchema,
  sanitizeRedirectPath,
} from "@/services/auth/schema";
import {
  calculateAgeFromDob,
  calculateProfileCompletion,
  CitizenProfileUpdateSchema,
  type ProfileRow,
} from "@/services/profile/schema";
import {
  isGuestOnlyAuthRoute,
  isProtectedCitizenRoute,
} from "@/infrastructure/supabase/middleware";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { CitizenProfileForm } from "@/components/profile/CitizenProfileForm";
import LoginPage from "@/app/(auth)/login/page";

describe("Phase 3 — Authentication & Citizen Profile Validation and Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  const emptyProfile: ProfileRow = {
    id: "11111111-1111-4111-8111-111111111111",
    full_name: null,
    date_of_birth: null,
    gender: null,
    state: null,
    district: null,
    occupation: null,
    education_level: null,
    employment_status: null,
    is_student: null,
    annual_household_income: null,
    household_size: null,
    social_category: null,
    is_farmer: null,
    land_holding_acres: null,
    is_business_owner: null,
    has_disability: null,
    preferred_language: "en",
    created_at: "2026-11-15T00:00:00Z",
    updated_at: "2026-11-15T00:00:00Z",
  };

  it("validates Login, Register, ForgotPassword, and ResetPassword schemas and blocks Aadhaar numbers in names", () => {
    expect(
      LoginInputSchema.safeParse({
        email: "citizen@example.com",
        password: "password123",
      }).success
    ).toBe(true);

    // Reject Aadhaar-like number in fullName
    const aadhaarName = RegisterInputSchema.safeParse({
      fullName: "Ramesh 1234 5678 9012",
      email: "ramesh@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(aadhaarName.success).toBe(false);

    // Reject mismatched passwords
    const mismatch = RegisterInputSchema.safeParse({
      fullName: "Ramesh Kumar",
      email: "ramesh@example.com",
      password: "password123",
      confirmPassword: "differentPassword",
    });
    expect(mismatch.success).toBe(false);

    expect(
      ForgotPasswordInputSchema.safeParse({ email: "citizen@example.com" })
        .success
    ).toBe(true);

    expect(
      ResetPasswordInputSchema.safeParse({
        password: "newStrongPassword123",
        confirmPassword: "newStrongPassword123",
      }).success
    ).toBe(true);
  });

  it("prevents open-redirect attacks in sanitizeRedirectPath", () => {
    expect(sanitizeRedirectPath("/profile")).toBe("/profile");
    expect(sanitizeRedirectPath("/schemes/pudhumai-penn")).toBe(
      "/schemes/pudhumai-penn"
    );
    expect(sanitizeRedirectPath("https://evil.example.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//evil.example.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/\\evil.example.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath(null)).toBe("/dashboard");
  });

  it("allows citizens to reveal and hide their login password", () => {
    render(
      <LanguageProvider>
        <LoginPage />
      </LanguageProvider>
    );

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("identifies protected citizen routes and guest-only auth routes accurately", () => {
    expect(isProtectedCitizenRoute("/dashboard")).toBe(true);
    expect(isProtectedCitizenRoute("/profile")).toBe(true);
    expect(isProtectedCitizenRoute("/opportunities")).toBe(true);
    expect(isProtectedCitizenRoute("/saved")).toBe(true);
    expect(isProtectedCitizenRoute("/assistant")).toBe(true);
    expect(isProtectedCitizenRoute("/discover")).toBe(false);
    expect(isProtectedCitizenRoute("/")).toBe(false);

    expect(isGuestOnlyAuthRoute("/login")).toBe(true);
    expect(isGuestOnlyAuthRoute("/register")).toBe(true);
    expect(isGuestOnlyAuthRoute("/forgot-password")).toBe(true);
    expect(isGuestOnlyAuthRoute("/reset-password")).toBe(false);
  });

  it("derives citizen age deterministically from date of birth", () => {
    const refDate = new Date("2026-11-15T00:00:00Z");
    expect(calculateAgeFromDob("2006-05-10", refDate)).toBe(20);
    expect(calculateAgeFromDob("2006-12-01", refDate)).toBe(19);
    expect(calculateAgeFromDob("invalid-date", refDate)).toBeNull();
    expect(calculateAgeFromDob(null, refDate)).toBeNull();
  });

  it("validates CitizenProfileUpdateSchema strictly and rejects injected user IDs or Aadhaar strings", () => {
    const validUpdate = CitizenProfileUpdateSchema.safeParse({
      full_name: "Meenakshi S",
      date_of_birth: "2004-06-15",
      gender: "female",
      state: "Tamil Nadu",
      district: "Madurai",
      education_level: "undergraduate",
      employment_status: "student",
      is_student: true,
      annual_household_income: 95000,
      household_size: 4,
      social_category: "bc",
      is_farmer: false,
      preferred_language: "ta",
    });
    expect(validUpdate.success).toBe(true);

    // Reject client-supplied id / user_id via .strict()
    const spoofedId = CitizenProfileUpdateSchema.safeParse({
      id: "22222222-2222-4222-8222-222222222222",
      full_name: "Spoof Attempt",
    });
    expect(spoofedId.success).toBe(false);

    // Reject Aadhaar in occupation
    const aadhaarOccupation = CitizenProfileUpdateSchema.safeParse({
      occupation: "Farmer 9876-5432-1098",
    });
    expect(aadhaarOccupation.success).toBe(false);
  });

  it("calculates profile completion percentage and onboarding status accurately", () => {
    const emptySummary = calculateProfileCompletion(null);
    expect(emptySummary.percentage).toBe(0);
    expect(emptySummary.isOnboardingComplete).toBe(false);

    const optionalFieldsOnly = calculateProfileCompletion({
      occupation: "Farmer",
      household_size: 4,
      social_category: "bc",
      is_farmer: true,
      land_holding_acres: 2,
      is_business_owner: false,
      has_disability: false,
      preferred_language: "ta",
    });
    expect(optionalFieldsOnly.percentage).toBe(0);

    const completeSummary = calculateProfileCompletion(
      {
        full_name: "Meenakshi S",
        date_of_birth: "2004-06-15",
        gender: "female",
        state: "Tamil Nadu",
        district: "Madurai",
        education_level: "undergraduate",
        employment_status: "student",
        annual_household_income: 95000,
      },
      new Date("2026-11-15T00:00:00Z")
    );
    expect(completeSummary.percentage).toBe(100);
    expect(completeSummary.derivedAge).toBe(22);
    expect(completeSummary.isOnboardingComplete).toBe(true);
    expect(completeSummary.missingCoreFields).toHaveLength(0);
  });

  it("starts a newly opened profile at 0% without selecting a default state", () => {
    const { container } = render(
      <LanguageProvider>
        <CitizenProfileForm initialProfile={emptyProfile} />
      </LanguageProvider>
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(container.querySelector<HTMLSelectElement>("#profile-state")?.value)
      .toBe("");
  });

  it("shows a save error instead of success when the API rejects the update", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Profile update failed." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <LanguageProvider>
        <CitizenProfileForm initialProfile={emptyProfile} />
      </LanguageProvider>
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Save Eligibility Profile/i })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Profile update failed."
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("shows a success status when the email-verification callback returns to the profile", () => {
    render(
      <LanguageProvider>
        <CitizenProfileForm initialProfile={emptyProfile} emailVerified />
      </LanguageProvider>
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Email verified successfully. Your account is ready."
    );
    expect(
      screen.getAllByRole("link", { name: /Go to Dashboard/i })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: /Go to Dashboard/i })[0]
    ).toHaveAttribute("href", "/dashboard");
  });

  it("renders CitizenProfileForm, displays derived age, and submits validated updates to /api/profile", async () => {
    const initialProfile: ProfileRow = {
      id: "11111111-1111-4111-8111-111111111111",
      full_name: "Karthik R",
      date_of_birth: "2000-01-15",
      gender: "male",
      state: "Tamil Nadu",
      district: "Chennai",
      occupation: "Student",
      education_level: "undergraduate",
      employment_status: "student",
      is_student: true,
      annual_household_income: 120000,
      household_size: 4,
      social_category: null,
      is_farmer: false,
      land_holding_acres: null,
      is_business_owner: false,
      has_disability: false,
      preferred_language: "en",
      created_at: "2026-11-15T00:00:00Z",
      updated_at: "2026-11-15T00:00:00Z",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          userId: initialProfile.id,
          email: "karthik@example.com",
          profile: initialProfile,
          completion: calculateProfileCompletion(initialProfile),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const { unmount } = render(
      <LanguageProvider>
        <CitizenProfileForm
          initialProfile={initialProfile}
          userEmail="karthik@example.com"
        />
      </LanguageProvider>
    );

    expect(screen.getByText("Your Eligibility Profile")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Karthik R")).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", {
      name: /Save Eligibility Profile/i,
    });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            full_name: "Karthik R",
            date_of_birth: "2000-01-15",
            gender: "male",
            state: "Tamil Nadu",
            district: "Chennai",
            occupation: "Student",
            education_level: "undergraduate",
            employment_status: "student",
            is_student: true,
            annual_household_income: 120000,
            household_size: 4,
            social_category: null,
            is_farmer: false,
            land_holding_acres: null,
            is_business_owner: false,
            has_disability: false,
            preferred_language: "en",
          }),
        })
      );
    });

    expect(
      await screen.findByText(/Your eligibility profile has been saved\./i)
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /Go to Dashboard/i })
        .every((link) => link.getAttribute("href") === "/dashboard")
    ).toBe(true);
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();

    unmount();
    render(
      <LanguageProvider>
        <CitizenProfileForm
          initialProfile={initialProfile}
          userEmail="karthik@example.com"
        />
      </LanguageProvider>
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Karthik R")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2000-01-15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Chennai")).toBeInTheDocument();
    expect(screen.getByDisplayValue("120000")).toBeInTheDocument();

    fetchSpy.mockRestore();
  });
});
