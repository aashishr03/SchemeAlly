import { describe, expect, it, vi } from "vitest";
import { ProfileRepository } from "@/infrastructure/repositories/profile-repository";
import type { ProfileRow } from "@/services/profile/schema";
import type { AppSupabaseClient } from "@/types/database";

const USER_ID = "11111111-1111-4111-8111-111111111111";

const savedProfile: ProfileRow = {
  id: USER_ID,
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

function createSupabaseMock() {
  const query = {
    update: vi.fn(),
    insert: vi.fn(),
    upsert: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };

  query.update.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.upsert.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);

  const supabase = {
    from: vi.fn(() => query),
  } as unknown as AppSupabaseClient;

  return { query, supabase };
}

describe("ProfileRepository updates", () => {
  it("patches only supplied fields for the authenticated profile", async () => {
    const { query, supabase } = createSupabaseMock();
    query.maybeSingle.mockResolvedValue({ data: savedProfile, error: null });
    const repository = new ProfileRepository(supabase);

    const result = await repository.updateByUserId(USER_ID, {
      full_name: "Karthik R",
    });

    expect(query.update).toHaveBeenCalledWith({ full_name: "Karthik R" });
    expect(query.eq).toHaveBeenCalledWith("id", USER_ID);
    expect(query.upsert).not.toHaveBeenCalled();
    expect(result.state).toBe("Tamil Nadu");
    expect(result.annual_household_income).toBe(120000);
  });

  it("does not write an empty update over an existing profile", async () => {
    const { query, supabase } = createSupabaseMock();
    query.maybeSingle.mockResolvedValue({ data: savedProfile, error: null });
    const repository = new ProfileRepository(supabase);

    const result = await repository.updateByUserId(USER_ID, {});

    expect(query.update).not.toHaveBeenCalled();
    expect(query.insert).not.toHaveBeenCalled();
    expect(query.upsert).not.toHaveBeenCalled();
    expect(result).toEqual(savedProfile);
  });
});
