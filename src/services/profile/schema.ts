import { z } from "zod";
import type { Database, PreferredLanguage } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const GENDER_OPTIONS = [
  "female",
  "male",
  "transgender",
  "other",
  "prefer_not_to_say",
] as const;

export const EDUCATION_LEVEL_OPTIONS = [
  "below_10th",
  "10th_pass",
  "12th_pass",
  "diploma",
  "undergraduate",
  "postgraduate",
  "doctorate",
  "other",
] as const;

export const EMPLOYMENT_STATUS_OPTIONS = [
  "student",
  "employed",
  "self_employed",
  "daily_wage",
  "unemployed",
  "homemaker",
  "retired",
] as const;

export const SOCIAL_CATEGORY_OPTIONS = [
  "general",
  "bc",
  "mbc",
  "obc",
  "sc",
  "st",
  "prefer_not_to_say",
] as const;

export const INDIAN_STATES = [
  "Tamil Nadu",
  "Andhra Pradesh",
  "Karnataka",
  "Kerala",
  "Puducherry",
  "Telangana",
  "Delhi",
  "Maharashtra",
  "Other",
] as const;

export const TAMIL_NADU_DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanniyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
  "Other",
] as const;

const AADHAAR_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;

function containsAadhaarLikeNumber(value: string | null | undefined): boolean {
  if (!value) return false;
  return AADHAAR_REGEX.test(value);
}

/**
 * Derives integer age in years from an ISO YYYY-MM-DD date of birth string.
 * Returns null if dateOfBirth is null, empty, or invalid.
 */
export function calculateAgeFromDob(
  dateOfBirth: string | null | undefined,
  referenceDate: Date = new Date()
): number | null {
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return null;
  }
  const [yearStr, monthStr, dayStr] = dateOfBirth.split("-");
  const birthYear = Number(yearStr);
  const birthMonth = Number(monthStr);
  const birthDay = Number(dayStr);

  if (
    !Number.isInteger(birthYear) ||
    !Number.isInteger(birthMonth) ||
    !Number.isInteger(birthDay) ||
    birthMonth < 1 ||
    birthMonth > 12 ||
    birthDay < 1 ||
    birthDay > 31
  ) {
    return null;
  }

  let age = referenceDate.getUTCFullYear() - birthYear;
  const currentMonth = referenceDate.getUTCMonth() + 1;
  const currentDay = referenceDate.getUTCDate();

  if (
    currentMonth < birthMonth ||
    (currentMonth === birthMonth && currentDay < birthDay)
  ) {
    age -= 1;
  }

  if (age < 0 || age > 130) {
    return null;
  }

  return age;
}

export const CitizenProfileUpdateSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be 100 characters or fewer")
      .refine(
        (val) => !containsAadhaarLikeNumber(val),
        "Do not enter an Aadhaar number in the profile"
      )
      .nullable()
      .optional(),
    date_of_birth: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format")
      .refine((dob) => calculateAgeFromDob(dob) !== null, {
        message: "Please enter a valid date of birth in the past",
      })
      .nullable()
      .optional(),
    gender: z.enum(GENDER_OPTIONS).nullable().optional(),
    state: z
      .string()
      .trim()
      .max(80, "State name is too long")
      .nullable()
      .optional(),
    district: z
      .string()
      .trim()
      .max(80, "District name is too long")
      .nullable()
      .optional(),
    occupation: z
      .string()
      .trim()
      .max(100, "Occupation must be 100 characters or fewer")
      .refine(
        (val) => !containsAadhaarLikeNumber(val),
        "Do not enter an Aadhaar number in the occupation field"
      )
      .nullable()
      .optional(),
    education_level: z.enum(EDUCATION_LEVEL_OPTIONS).nullable().optional(),
    employment_status: z.enum(EMPLOYMENT_STATUS_OPTIONS).nullable().optional(),
    is_student: z.boolean().nullable().optional(),
    annual_household_income: z
      .number()
      .min(0, "Annual household income cannot be negative")
      .max(100_000_000, "Annual household income exceeds allowed range")
      .nullable()
      .optional(),
    household_size: z
      .number()
      .int("Household size must be a whole number")
      .min(1, "Household size must be at least 1")
      .max(50, "Household size must be 50 or fewer")
      .nullable()
      .optional(),
    social_category: z.enum(SOCIAL_CATEGORY_OPTIONS).nullable().optional(),
    is_farmer: z.boolean().nullable().optional(),
    land_holding_acres: z
      .number()
      .min(0, "Land holding cannot be negative")
      .max(10_000, "Land holding exceeds allowed range")
      .nullable()
      .optional(),
    is_business_owner: z.boolean().nullable().optional(),
    has_disability: z.boolean().nullable().optional(),
    preferred_language: z.enum(["en", "ta"]).optional(),
  })
  .strict();

export type CitizenProfileUpdateInput = z.infer<
  typeof CitizenProfileUpdateSchema
>;

export interface ProfileCompletionSummary {
  percentage: number;
  completedCoreFields: string[];
  missingCoreFields: string[];
  derivedAge: number | null;
  isOnboardingComplete: boolean;
}

const CORE_ELIGIBILITY_FIELDS: readonly {
  key: keyof ProfileRow;
  labelKey: string;
}[] = [
  { key: "full_name", labelKey: "fullName" },
  { key: "date_of_birth", labelKey: "dateOfBirth" },
  { key: "gender", labelKey: "gender" },
  { key: "state", labelKey: "state" },
  { key: "district", labelKey: "district" },
  { key: "education_level", labelKey: "educationLevel" },
  { key: "employment_status", labelKey: "employmentStatus" },
  { key: "annual_household_income", labelKey: "annualHouseholdIncome" },
];

/**
 * Calculates deterministic profile completion based on the 8 core eligibility fields.
 * Optional/sensitive fields (such as social_category, disability, land holding) never penalize completion.
 */
export function calculateProfileCompletion(
  profile: Partial<ProfileRow> | null | undefined,
  referenceDate: Date = new Date()
): ProfileCompletionSummary {
  if (!profile) {
    return {
      percentage: 0,
      completedCoreFields: [],
      missingCoreFields: CORE_ELIGIBILITY_FIELDS.map((f) => f.labelKey),
      derivedAge: null,
      isOnboardingComplete: false,
    };
  }

  const completedCoreFields: string[] = [];
  const missingCoreFields: string[] = [];

  for (const field of CORE_ELIGIBILITY_FIELDS) {
    const val = profile[field.key];
    const isPresent =
      val !== null &&
      val !== undefined &&
      (typeof val !== "string" || val.trim().length > 0);
    if (isPresent) {
      completedCoreFields.push(field.labelKey);
    } else {
      missingCoreFields.push(field.labelKey);
    }
  }

  const percentage = Math.round(
    (completedCoreFields.length / CORE_ELIGIBILITY_FIELDS.length) * 100
  );
  const derivedAge = calculateAgeFromDob(
    profile.date_of_birth ?? null,
    referenceDate
  );

  // Onboarding is considered functionally complete once DOB, State, and Income are provided
  const isOnboardingComplete = Boolean(
    profile.date_of_birth &&
      profile.state &&
      profile.annual_household_income !== null &&
      profile.annual_household_income !== undefined
  );

  return {
    percentage,
    completedCoreFields,
    missingCoreFields,
    derivedAge,
    isOnboardingComplete,
  };
}

export function normalizePreferredLanguage(
  value: unknown
): PreferredLanguage {
  return value === "ta" ? "ta" : "en";
}
