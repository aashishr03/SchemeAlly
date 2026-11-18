import type { Json } from "@/types/database";
import { calculateAgeFromDob } from "@/services/profile/schema";
import {
  extractAdditionalConditionsFromRootGroup,
  type AdditionalVerificationCondition,
} from "@/services/scheme/schema";
import {
  SUPPORTED_ELIGIBILITY_OPERATORS,
  type ConditionEvaluationDetail,
  type ConditionEvaluationStatus,
  type EligibilityOperator,
  type EligibilityOutcome,
  type EvaluableCitizenProfile,
  type EvaluateSchemeEligibilityOptions,
  type SchemeEligibilityEvaluationResult,
  type SpecEligibilityEngineStatus,
} from "./types";

const FIELD_LABELS: Record<string, { en: string; ta: string }> = {
  age: { en: "Age (Date of Birth)", ta: "வயது (பிறந்த தேதி)" },
  date_of_birth: { en: "Date of Birth", ta: "பிறந்த தேதி" },
  gender: { en: "Gender", ta: "பாலினம்" },
  state: { en: "State", ta: "மாநிலம்" },
  district: { en: "District", ta: "மாவட்டம்" },
  occupation: { en: "Occupation", ta: "தொழில்" },
  education_level: { en: "Education Level", ta: "கல்வித் தகுதி" },
  employment_status: { en: "Employment Status", ta: "பணி நிலை" },
  is_student: { en: "Student Status", ta: "மாணவர் நிலை" },
  annual_household_income: {
    en: "Annual Household Income",
    ta: "குடும்ப ஆண்டு வருமானம்",
  },
  household_size: {
    en: "Household Size",
    ta: "குடும்ப உறுப்பினர்களின் எண்ணிக்கை",
  },
  social_category: { en: "Social Category", ta: "சமூகப் பிரிவு" },
  is_farmer: { en: "Farmer Status", ta: "விவசாயி நிலை" },
  land_holding_acres: {
    en: "Agricultural Land Holding (Acres)",
    ta: "வேளாண் நில உடைமை (ஏக்கர்)",
  },
  is_business_owner: {
    en: "Small Business / Vendor Status",
    ta: "சிறு வணிகம் / வியாபாரி நிலை",
  },
  has_disability: {
    en: "Person with Disability (PwD) Status",
    ta: "மாற்றுத்திறனாளி நிலை",
  },
};

export const OUTCOME_METADATA: Record<
  EligibilityOutcome,
  {
    engineStatus: SpecEligibilityEngineStatus;
    title_en: string;
    title_ta: string;
    description_en: string;
    description_ta: string;
  }
> = {
  ELIGIBLE: {
    engineStatus: "ELIGIBLE",
    title_en: "Eligible",
    title_ta: "தகுதியுடையவர்",
    description_en:
      "All configured and required conditions have been evaluated and satisfied.",
    description_ta:
      "கட்டமைக்கப்பட்ட மற்றும் தேவையான அனைத்து நிபந்தனைகளும் சரிபார்க்கப்பட்டு பூர்த்தி செய்யப்பட்டுள்ளன.",
  },
  POTENTIAL_MATCH: {
    engineStatus: "NEEDS_VERIFICATION",
    title_en: "Potential Match",
    title_ta: "சாத்தியமான பொருத்தம் (சரிபார்ப்பு தேவை)",
    description_en:
      "Basic profile conditions match, but additional scheme-specific conditions require verification.",
    description_ta:
      "அடிப்படை சுயவிவர நிபந்தனைகள் பொருந்துகின்றன, ஆனால் திட்டத்திற்கே உரித்தான கூடுதல் நிபந்தனைகளுக்குச் சரிபார்ப்பு தேவை.",
  },
  NOT_ELIGIBLE: {
    engineStatus: "NOT_ELIGIBLE",
    title_en: "Not Eligible",
    title_ta: "தகுதியில்லை",
    description_en: "A confirmed mandatory condition fails.",
    description_ta: "உறுதிப்படுத்தப்பட்ட கட்டாய நிபந்தனை பொருந்தவில்லை.",
  },
  INSUFFICIENT_INFORMATION: {
    engineStatus: "INSUFFICIENT_INFORMATION",
    title_en: "Insufficient Information",
    title_ta: "போதுமான விவரம் இல்லை",
    description_en: "Required profile information is missing.",
    description_ta: "தேவையான சுயவிவரத் தகவல்கள் விடுபட்டுள்ளன.",
  },
};

function isSupportedOperator(op: unknown): op is EligibilityOperator {
  return (
    typeof op === "string" &&
    (SUPPORTED_ELIGIBILITY_OPERATORS as readonly string[]).includes(op)
  );
}

function resolveProfileFieldValue(
  profile: EvaluableCitizenProfile | null | undefined,
  field: string,
  referenceDate: Date
): Json {
  if (!profile) {
    return null;
  }

  if (field === "age") {
    if (typeof profile.age === "number" && Number.isFinite(profile.age)) {
      return profile.age;
    }
    return calculateAgeFromDob(profile.date_of_birth ?? null, referenceDate);
  }

  const raw = (profile as Record<string, unknown>)[field];
  if (raw === undefined || raw === null) {
    return null;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return null;
    }
    // "prefer_not_to_say" means the citizen declined to specify gender/social_category,
    // so it cannot be treated as a known value when a scheme requires a specific category/gender
    if (
      (field === "gender" || field === "social_category") &&
      trimmed === "prefer_not_to_say"
    ) {
      return null;
    }
    return trimmed;
  }

  if (typeof raw === "number" || typeof raw === "boolean") {
    return raw;
  }

  if (Array.isArray(raw)) {
    return raw as Json;
  }

  return null;
}

function compareConditionValue(
  operator: EligibilityOperator,
  actual: Json,
  expected: Json
): boolean {
  switch (operator) {
    case "EQUALS": {
      if (typeof actual === "string" && typeof expected === "string") {
        return actual.toLowerCase() === expected.toLowerCase();
      }
      return actual === expected;
    }

    case "NOT_EQUALS": {
      if (typeof actual === "string" && typeof expected === "string") {
        return actual.toLowerCase() !== expected.toLowerCase();
      }
      return actual !== expected;
    }

    case "GREATER_THAN": {
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual > expected
      );
    }

    case "GREATER_THAN_OR_EQUAL": {
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual >= expected
      );
    }

    case "LESS_THAN": {
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual < expected
      );
    }

    case "LESS_THAN_OR_EQUAL": {
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual <= expected
      );
    }

    case "IN": {
      if (!Array.isArray(expected)) return false;
      return expected.some((item) => {
        if (typeof actual === "string" && typeof item === "string") {
          return actual.toLowerCase() === item.toLowerCase();
        }
        return actual === item;
      });
    }

    case "NOT_IN": {
      if (!Array.isArray(expected)) return false;
      return !expected.some((item) => {
        if (typeof actual === "string" && typeof item === "string") {
          return actual.toLowerCase() === item.toLowerCase();
        }
        return actual === item;
      });
    }

    case "CONTAINS": {
      if (Array.isArray(actual)) {
        return actual.some((item) => {
          if (typeof item === "string" && typeof expected === "string") {
            return item.toLowerCase() === expected.toLowerCase();
          }
          return item === expected;
        });
      }
      if (typeof actual === "string" && typeof expected === "string") {
        return actual.toLowerCase().includes(expected.toLowerCase());
      }
      return false;
    }

    case "BETWEEN": {
      if (
        typeof actual !== "number" ||
        !Array.isArray(expected) ||
        expected.length !== 2 ||
        typeof expected[0] !== "number" ||
        typeof expected[1] !== "number"
      ) {
        return false;
      }
      const min = Math.min(expected[0], expected[1]);
      const max = Math.max(expected[0], expected[1]);
      return actual >= min && actual <= max;
    }
  }
}

interface NodeEvaluationInternal {
  status: ConditionEvaluationStatus;
  passed: ConditionEvaluationDetail[];
  failed: ConditionEvaluationDetail[];
  missing: ConditionEvaluationDetail[];
  evaluatedConditionCount: number;
}

function evaluateNode(
  node: Json | null | undefined,
  profile: EvaluableCitizenProfile | null | undefined,
  referenceDate: Date
): NodeEvaluationInternal {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return {
      status: "MISSING",
      passed: [],
      failed: [],
      missing: [],
      evaluatedConditionCount: 0,
    };
  }

  const record = node as Record<string, Json | undefined>;
  const nodeType = record.type;

  if (nodeType === "CONDITION") {
    const id = typeof record.id === "string" ? record.id : "cond";
    const field = typeof record.field === "string" ? record.field : "unknown";
    const operator: EligibilityOperator = isSupportedOperator(record.operator)
      ? record.operator
      : "EQUALS";
    const expectedValue = (record.value ?? null) as Json;
    const label_en =
      typeof record.label_en === "string" && record.label_en.trim().length > 0
        ? record.label_en.trim()
        : `${field} ${operator} ${JSON.stringify(expectedValue)}`;
    const label_ta =
      typeof record.label_ta === "string" && record.label_ta.trim().length > 0
        ? record.label_ta.trim()
        : label_en;

    const actualValue = resolveProfileFieldValue(profile, field, referenceDate);
    const fieldLabel = FIELD_LABELS[field] ?? { en: field, ta: field };

    if (actualValue === null || actualValue === undefined) {
      const detail: ConditionEvaluationDetail = {
        id,
        field,
        operator,
        expectedValue,
        actualValue: null,
        status: "MISSING",
        label_en,
        label_ta,
        explanation_en: `Missing required profile field: ${fieldLabel.en} (${label_en}).`,
        explanation_ta: `தேவையான சுயவிவர விவரம் விடுபட்டுள்ளது: ${fieldLabel.ta} (${label_ta}).`,
      };
      return {
        status: "MISSING",
        passed: [],
        failed: [],
        missing: [detail],
        evaluatedConditionCount: 1,
      };
    }

    const isMatch = compareConditionValue(operator, actualValue, expectedValue);
    if (isMatch) {
      const detail: ConditionEvaluationDetail = {
        id,
        field,
        operator,
        expectedValue,
        actualValue,
        status: "PASSED",
        label_en,
        label_ta,
        explanation_en: `Condition satisfied: ${label_en}.`,
        explanation_ta: `நிபந்தனை பூர்த்தி செய்யப்பட்டது: ${label_ta}.`,
      };
      return {
        status: "PASSED",
        passed: [detail],
        failed: [],
        missing: [],
        evaluatedConditionCount: 1,
      };
    }

    const detail: ConditionEvaluationDetail = {
      id,
      field,
      operator,
      expectedValue,
      actualValue,
      status: "FAILED",
      label_en,
      label_ta,
      explanation_en: `Condition not met: ${label_en}.`,
      explanation_ta: `நிபந்தனை பொருந்தவில்லை: ${label_ta}.`,
    };
    return {
      status: "FAILED",
      passed: [],
      failed: [detail],
      missing: [],
      evaluatedConditionCount: 1,
    };
  }

  if (nodeType === "GROUP" && Array.isArray(record.children)) {
    const logicalOperator: "AND" | "OR" =
      record.logicalOperator === "OR" ? "OR" : "AND";

    // Filter out non-condition/group nodes (such as VERIFICATION nodes handled separately)
    const evaluableChildren = record.children.filter((child) => {
      if (!child || typeof child !== "object" || Array.isArray(child)) {
        return false;
      }
      const cType = (child as Record<string, Json | undefined>).type;
      return cType === "CONDITION" || cType === "GROUP";
    });

    if (evaluableChildren.length === 0) {
      return {
        status: "MISSING",
        passed: [],
        failed: [],
        missing: [],
        evaluatedConditionCount: 0,
      };
    }

    const childResults = evaluableChildren.map((child) =>
      evaluateNode(child, profile, referenceDate)
    );

    const passed = childResults.flatMap((r) => r.passed);
    const failed = childResults.flatMap((r) => r.failed);
    const missing = childResults.flatMap((r) => r.missing);
    const evaluatedConditionCount = childResults.reduce(
      (sum, r) => sum + r.evaluatedConditionCount,
      0
    );

    if (logicalOperator === "AND") {
      if (childResults.some((r) => r.status === "FAILED")) {
        return {
          status: "FAILED",
          passed,
          failed,
          missing,
          evaluatedConditionCount,
        };
      }
      if (childResults.some((r) => r.status === "MISSING")) {
        return {
          status: "MISSING",
          passed,
          failed,
          missing,
          evaluatedConditionCount,
        };
      }
      return {
        status: "PASSED",
        passed,
        failed,
        missing,
        evaluatedConditionCount,
      };
    } else {
      // OR group: if at least one branch PASSED, the OR group PASSED.
      // In that case, failed/missing branches in the OR group do not block the pass.
      if (childResults.some((r) => r.status === "PASSED")) {
        return {
          status: "PASSED",
          passed,
          failed: [],
          missing: [],
          evaluatedConditionCount,
        };
      }
      if (childResults.some((r) => r.status === "MISSING")) {
        return {
          status: "MISSING",
          passed,
          failed,
          missing,
          evaluatedConditionCount,
        };
      }
      return {
        status: "FAILED",
        passed,
        failed,
        missing,
        evaluatedConditionCount,
      };
    }
  }

  return {
    status: "MISSING",
    passed: [],
    failed: [],
    missing: [],
    evaluatedConditionCount: 0,
  };
}

/**
 * Evaluates a citizen profile deterministically against a scheme's versioned `root_group` rule.
 *
 * Product-safety rule:
 * - Never returns `ELIGIBLE` solely because automated `root_group` profile conditions pass
 *   when additional mandatory scheme-specific conditions (`additionalConditions`) remain unverified.
 * - Instead returns `POTENTIAL_MATCH` (`engineStatus: "NEEDS_VERIFICATION"`, `isDefinitivelyEligible: false`)
 *   and lists all unverified bilingual conditions.
 */
export function evaluateSchemeEligibility(
  profile: EvaluableCitizenProfile | null | undefined,
  rootGroup: Json | null | undefined,
  options: EvaluateSchemeEligibilityOptions = {}
): SchemeEligibilityEvaluationResult {
  const referenceDate = options.referenceDate ?? new Date();
  const evaluatedAt = options.evaluatedAt ?? referenceDate.toISOString();
  const ruleVersion = options.ruleVersion ?? 1;

  const verifiedIdsSet: ReadonlySet<string> =
    options.verifiedAdditionalConditionIds instanceof Set
      ? options.verifiedAdditionalConditionIds
      : new Set(options.verifiedAdditionalConditionIds ?? []);

  const additionalVerificationConditions: AdditionalVerificationCondition[] =
    extractAdditionalConditionsFromRootGroup(rootGroup);

  const unverifiedAdditionalConditions =
    additionalVerificationConditions.filter(
      (cond) => !verifiedIdsSet.has(cond.id)
    );

  const rootObj =
    rootGroup && typeof rootGroup === "object" && !Array.isArray(rootGroup)
      ? (rootGroup as Record<string, Json | undefined>)
      : null;
  const requiresExplicitManualVerification =
    rootObj?.requiresManualVerification === true;

  const nodeEval = evaluateNode(rootGroup, profile, referenceDate);

  const missingFields = Array.from(
    new Set(
      nodeEval.missing.map((m) =>
        m.field === "age" ? "date_of_birth" : m.field
      )
    )
  );

  let outcome: EligibilityOutcome;

  if (nodeEval.evaluatedConditionCount === 0) {
    outcome = "INSUFFICIENT_INFORMATION";
  } else if (nodeEval.status === "FAILED") {
    outcome = "NOT_ELIGIBLE";
  } else if (nodeEval.status === "MISSING") {
    outcome = "INSUFFICIENT_INFORMATION";
  } else {
    // Automated profile conditions passed.
    // Product safety check: NEVER return ELIGIBLE if any additional scheme-specific
    // verification condition remains unverified.
    if (
      unverifiedAdditionalConditions.length > 0 ||
      requiresExplicitManualVerification
    ) {
      outcome = "POTENTIAL_MATCH";
    } else {
      outcome = "ELIGIBLE";
    }
  }

  const meta = OUTCOME_METADATA[outcome];

  return {
    outcome,
    engineStatus: meta.engineStatus,
    isDefinitivelyEligible: outcome === "ELIGIBLE",
    outcomeTitle_en: meta.title_en,
    outcomeTitle_ta: meta.title_ta,
    outcomeDescription_en: meta.description_en,
    outcomeDescription_ta: meta.description_ta,
    passedConditions: nodeEval.passed,
    failedConditions: nodeEval.failed,
    missingConditions: nodeEval.missing,
    missingFields,
    additionalVerificationConditions,
    unverifiedAdditionalConditions,
    ruleVersion,
    evaluatedAt,
  };
}
