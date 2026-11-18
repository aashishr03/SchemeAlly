import type { Json } from "@/types/database";
import type { ProfileRow } from "@/services/profile/schema";
import type { AdditionalVerificationCondition } from "@/services/scheme/schema";

export const SUPPORTED_ELIGIBILITY_OPERATORS = [
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL",
  "IN",
  "NOT_IN",
  "CONTAINS",
  "BETWEEN",
] as const;

export type EligibilityOperator =
  (typeof SUPPORTED_ELIGIBILITY_OPERATORS)[number];

/**
 * User-facing eligibility outcome classifications.
 * - `ELIGIBLE`: All configured and required conditions have been evaluated and satisfied, with zero unverified additional conditions remaining.
 * - `POTENTIAL_MATCH`: Basic profile conditions match, but additional scheme-specific conditions require verification.
 * - `NOT_ELIGIBLE`: A confirmed mandatory condition fails.
 * - `INSUFFICIENT_INFORMATION`: Required profile information is missing.
 */
export type EligibilityOutcome =
  | "ELIGIBLE"
  | "POTENTIAL_MATCH"
  | "NOT_ELIGIBLE"
  | "INSUFFICIENT_INFORMATION";

/**
 * Canonical engine result codes from spec.md Section 9.
 * `POTENTIAL_MATCH` maps to `NEEDS_VERIFICATION` when basic profile rules pass
 * while mandatory scheme-specific conditions still require verification.
 */
export type SpecEligibilityEngineStatus =
  | "ELIGIBLE"
  | "NOT_ELIGIBLE"
  | "INSUFFICIENT_INFORMATION"
  | "NEEDS_VERIFICATION";

export type ConditionEvaluationStatus = "PASSED" | "FAILED" | "MISSING";

export interface ConditionEvaluationDetail {
  id: string;
  field: string;
  operator: EligibilityOperator;
  expectedValue: Json;
  actualValue: Json;
  status: ConditionEvaluationStatus;
  label_en: string;
  label_ta: string;
  explanation_en: string;
  explanation_ta: string;
}

export type EvaluableCitizenProfile = Partial<ProfileRow> & {
  age?: number | null;
};

export interface EvaluateSchemeEligibilityOptions {
  ruleVersion?: number;
  referenceDate?: Date;
  evaluatedAt?: string;
  /**
   * Optional set/list of additional condition IDs that have been explicitly
   * verified through an authorized verification workflow. Defaults to empty.
   * Unless every `additionalConditions` item is present here, a profile match
   * produces `POTENTIAL_MATCH` (`NEEDS_VERIFICATION`) and never `ELIGIBLE`.
   */
  verifiedAdditionalConditionIds?: ReadonlySet<string> | readonly string[];
}

export interface SchemeEligibilityEvaluationResult {
  outcome: EligibilityOutcome;
  engineStatus: SpecEligibilityEngineStatus;
  /**
   * Product-safety flag: true ONLY when `outcome === "ELIGIBLE"` (all automated
   * conditions passed AND zero unverified scheme-specific conditions remain).
   */
  isDefinitivelyEligible: boolean;
  outcomeTitle_en: string;
  outcomeTitle_ta: string;
  outcomeDescription_en: string;
  outcomeDescription_ta: string;
  passedConditions: ConditionEvaluationDetail[];
  failedConditions: ConditionEvaluationDetail[];
  missingConditions: ConditionEvaluationDetail[];
  missingFields: string[];
  additionalVerificationConditions: AdditionalVerificationCondition[];
  unverifiedAdditionalConditions: AdditionalVerificationCondition[];
  ruleVersion: number;
  evaluatedAt: string;
}
