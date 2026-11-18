import type { Json } from "@/types/database";
import type { SchemeListItem } from "@/services/scheme/schema";
import { evaluateSchemeEligibility } from "./evaluator";
import type {
  EligibilityOutcome,
  EvaluableCitizenProfile,
  SchemeEligibilityEvaluationResult,
} from "./types";

export interface ActiveSchemeRule {
  scheme_id: string;
  rule_version: number;
  root_group: Json;
}

export interface SchemeEvaluationEntry {
  scheme: SchemeListItem;
  evaluation: SchemeEligibilityEvaluationResult;
}

export type EligibilityOutcomeCounts = Record<EligibilityOutcome, number>;

export interface CatalogueEvaluationSummary {
  entries: SchemeEvaluationEntry[];
  counts: EligibilityOutcomeCounts;
  totalEvaluated: number;
  /** Schemes with no active rule are never evaluated (and never shown as eligible). */
  unevaluatedSchemeCount: number;
}

/** Display order: strongest signal first. */
export const OUTCOME_PRIORITY: readonly EligibilityOutcome[] = [
  "ELIGIBLE",
  "POTENTIAL_MATCH",
  "INSUFFICIENT_INFORMATION",
  "NOT_ELIGIBLE",
];

/**
 * Single reusable entry point for profile-driven evaluation of the catalogue.
 * Used by the dashboard and the opportunities page so evaluation logic is never
 * duplicated. Delegates every decision to `evaluateSchemeEligibility`, which
 * never returns ELIGIBLE while additional scheme-specific conditions are
 * unverified. No condition is ever marked verified here.
 */
export function evaluateCatalogueForProfile(
  profile: EvaluableCitizenProfile | null | undefined,
  schemes: readonly SchemeListItem[],
  rules: readonly ActiveSchemeRule[],
  options: { referenceDate?: Date } = {}
): CatalogueEvaluationSummary {
  const latestRuleByScheme = new Map<string, ActiveSchemeRule>();
  for (const rule of rules) {
    const existing = latestRuleByScheme.get(rule.scheme_id);
    if (!existing || rule.rule_version > existing.rule_version) {
      latestRuleByScheme.set(rule.scheme_id, rule);
    }
  }

  const counts: EligibilityOutcomeCounts = {
    ELIGIBLE: 0,
    POTENTIAL_MATCH: 0,
    INSUFFICIENT_INFORMATION: 0,
    NOT_ELIGIBLE: 0,
  };

  const entries: SchemeEvaluationEntry[] = [];
  let unevaluatedSchemeCount = 0;

  for (const scheme of schemes) {
    // Defence in depth: unverified or archived schemes are never evaluated.
    if (!scheme.is_verified || scheme.status !== "active") {
      continue;
    }
    const rule = latestRuleByScheme.get(scheme.id);
    if (!rule) {
      unevaluatedSchemeCount += 1;
      continue;
    }
    const evaluation = evaluateSchemeEligibility(profile, rule.root_group, {
      ruleVersion: rule.rule_version,
      referenceDate: options.referenceDate,
    });
    counts[evaluation.outcome] += 1;
    entries.push({ scheme, evaluation });
  }

  entries.sort((a, b) => {
    const diff =
      OUTCOME_PRIORITY.indexOf(a.evaluation.outcome) -
      OUTCOME_PRIORITY.indexOf(b.evaluation.outcome);
    return diff !== 0 ? diff : a.scheme.name_en.localeCompare(b.scheme.name_en);
  });

  return {
    entries,
    counts,
    totalEvaluated: entries.length,
    unevaluatedSchemeCount,
  };
}
