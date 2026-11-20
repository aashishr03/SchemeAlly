import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSupabaseClient } from "@/types/database";
import type { ProfileRow } from "@/services/profile/schema";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedServerUser: vi.fn(),
  getByUserId: vi.fn(),
  upsertByUserId: vi.fn(),
  updateByUserId: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
  requireAuthenticatedServerUser: mocks.requireAuthenticatedServerUser,
}));
vi.mock("@/infrastructure/repositories/profile-repository", () => ({
  ProfileRepository: class {
    getByUserId = mocks.getByUserId;
    upsertByUserId = mocks.upsertByUserId;
    updateByUserId = mocks.updateByUserId;
  },
}));

import { getAuthenticatedCitizenProfile } from "@/services/profile/profile-service";

const USER_ID = "11111111-1111-4111-8111-111111111111";

const emptyProfile: ProfileRow = {
  id: USER_ID,
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

describe("authenticated profile name synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedServerUser.mockResolvedValue({
      id: USER_ID,
      email: "maya@example.test",
      user_metadata: { full_name: "Maya R" },
    });
  });

  it("persists the registration name from auth metadata when the profile name is blank", async () => {
    const savedProfile = { ...emptyProfile, full_name: "Maya R" };
    mocks.getByUserId.mockResolvedValue(emptyProfile);
    mocks.updateByUserId.mockResolvedValue(savedProfile);

    const result = await getAuthenticatedCitizenProfile(
      {} as AppSupabaseClient
    );

    expect(mocks.updateByUserId).toHaveBeenCalledWith(USER_ID, {
      full_name: "Maya R",
    });
    expect(result.profile.full_name).toBe("Maya R");
  });

  it("preserves an existing saved name instead of replacing it from auth metadata", async () => {
    const savedProfile = { ...emptyProfile, full_name: "Saved Profile Name" };
    mocks.getByUserId.mockResolvedValue(savedProfile);

    const result = await getAuthenticatedCitizenProfile(
      {} as AppSupabaseClient
    );

    expect(mocks.updateByUserId).not.toHaveBeenCalled();
    expect(result.profile.full_name).toBe("Saved Profile Name");
  });
});
