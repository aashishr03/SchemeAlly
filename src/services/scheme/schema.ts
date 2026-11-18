import { z } from "zod";
import type { GovernmentLevel, Json, SchemeStatus } from "@/types/database";

export const TARGET_AUDIENCE_OPTIONS = [
  "students",
  "women",
  "farmers",
  "families",
  "senior_citizens",
  "job_seekers",
  "small_business",
  "artisans",
] as const;

export type TargetAudienceTag = (typeof TARGET_AUDIENCE_OPTIONS)[number];

export const GOVERNMENT_LEVEL_FILTERS = ["all", "state", "central"] as const;
export type GovernmentLevelFilter = (typeof GOVERNMENT_LEVEL_FILTERS)[number];

export const STATE_COVERAGE_FILTERS = ["all", "TN", "ALL"] as const;
export type StateCoverageFilter = (typeof STATE_COVERAGE_FILTERS)[number];

export const TARGET_AUDIENCE_FILTERS = [
  "all",
  ...TARGET_AUDIENCE_OPTIONS,
] as const;
export type TargetAudienceFilter = (typeof TARGET_AUDIENCE_FILTERS)[number];

/**
 * Sanitizes free-text search input before use in PostgREST `.or()` ILIKE filters
 * or client-side search, removing characters that could break filter syntax.
 */
export function sanitizeSearchQuery(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/[(),%*\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export const SchemeFilterParamsSchema = z.object({
  q: z
    .string()
    .optional()
    .default("")
    .transform((val) => sanitizeSearchQuery(val)),
  category: z
    .string()
    .trim()
    .max(80, "Category filter is too long")
    .regex(/^[a-z0-9-]*$/, "Invalid category filter")
    .optional()
    .default("all")
    .transform((val) => (val === "" ? "all" : val)),
  level: z.enum(GOVERNMENT_LEVEL_FILTERS).optional().default("all"),
  state: z.enum(STATE_COVERAGE_FILTERS).optional().default("all"),
  audience: z.enum(TARGET_AUDIENCE_FILTERS).optional().default("all"),
});

export type SchemeFilterParams = z.infer<typeof SchemeFilterParamsSchema>;

export const SchemeSlugSchema = z
  .string()
  .trim()
  .min(2, "Scheme slug is required")
  .max(120, "Scheme slug is too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid scheme slug format");

export function getSchemeDetailHref(slug: string): string {
  return `/schemes/${encodeURIComponent(slug)}`;
}

export interface SchemeCategorySummary {
  id: string;
  slug: string;
  name_en: string;
  name_ta: string;
  description_en: string | null;
  description_ta: string | null;
  icon: string | null;
  display_order: number;
  scheme_count?: number;
}

export interface SchemeListItem {
  id: string;
  slug: string;
  category_id: string;
  category: {
    id: string;
    slug: string;
    name_en: string;
    name_ta: string;
    icon: string | null;
  };
  name_en: string;
  name_ta: string;
  short_description_en: string;
  short_description_ta: string;
  benefits_en: string;
  benefits_ta: string;
  department_en: string;
  department_ta: string;
  government_level: GovernmentLevel;
  state_code: string;
  target_audiences: string[];
  official_source_url: string;
  official_application_url: string | null;
  last_verified_at: string | null;
  is_verified: boolean;
  status: SchemeStatus;
  mandatory_documents_count: number;
}

export interface StructuredConditionPreview {
  id: string;
  field: string;
  operator: string;
  value: Json;
  label_en: string;
  label_ta: string;
  groupOperator: "AND" | "OR";
}

export interface AdditionalVerificationCondition {
  id: string;
  label_en: string;
  label_ta: string;
}

export interface SchemeEligibilityRuleDetail {
  id: string;
  rule_version: number;
  is_active: boolean;
  root_group: Json;
  root_logical_operator: "AND" | "OR";
  summary_en: string | null;
  summary_ta: string | null;
  conditions: StructuredConditionPreview[];
  additional_conditions: AdditionalVerificationCondition[];
}

export interface SchemeRequiredDocumentDetail {
  id: string;
  document_type_code: string;
  name_en: string;
  name_ta: string;
  description_en: string | null;
  description_ta: string | null;
  is_mandatory: boolean;
  requires_unexpired: boolean;
  display_order: number;
}

export interface SchemeApplicationStepDetail {
  id: string;
  step_number: number;
  title_en: string;
  title_ta: string;
  description_en: string;
  description_ta: string;
}

export interface SchemeSourceDetail {
  id: string;
  source_title: string;
  source_url: string;
  source_type: string;
  verified_at: string;
}

export interface SchemeDetailItem extends SchemeListItem {
  detailed_description_en: string;
  detailed_description_ta: string;
  application_instructions_en: string;
  application_instructions_ta: string;
  eligibility_rule: SchemeEligibilityRuleDetail | null;
  required_documents: SchemeRequiredDocumentDetail[];
  application_steps: SchemeApplicationStepDetail[];
  sources: SchemeSourceDetail[];
}

export interface SchemeCatalogueResult {
  categories: SchemeCategorySummary[];
  schemes: SchemeListItem[];
  totalVerifiedCount: number;
  appliedFilters: SchemeFilterParams;
}

/**
 * Extracts structured condition previews from a scheme's JSONB `root_group` tree
 * so the Scheme Detail page can display every verified condition in English and Tamil.
 */
export function extractConditionsFromRootGroup(
  rootGroup: Json | null | undefined,
  parentOperator: "AND" | "OR" = "AND"
): StructuredConditionPreview[] {
  if (!rootGroup || typeof rootGroup !== "object" || Array.isArray(rootGroup)) {
    return [];
  }

  const node = rootGroup as Record<string, Json | undefined>;
  const nodeType = node.type;

  if (nodeType === "CONDITION") {
    const id = typeof node.id === "string" ? node.id : "cond";
    const field = typeof node.field === "string" ? node.field : "unknown";
    const operator = typeof node.operator === "string" ? node.operator : "EQUALS";
    const value = (node.value ?? null) as Json;
    const label_en =
      typeof node.label_en === "string" && node.label_en.trim().length > 0
        ? node.label_en
        : `${field} ${operator} ${JSON.stringify(value)}`;
    const label_ta =
      typeof node.label_ta === "string" && node.label_ta.trim().length > 0
        ? node.label_ta
        : label_en;

    return [
      {
        id,
        field,
        operator,
        value,
        label_en,
        label_ta,
        groupOperator: parentOperator,
      },
    ];
  }

  if (nodeType === "GROUP" && Array.isArray(node.children)) {
    const groupOp: "AND" | "OR" =
      node.logicalOperator === "OR" ? "OR" : "AND";
    const collected: StructuredConditionPreview[] = [];
    for (const child of node.children) {
      collected.push(...extractConditionsFromRootGroup(child, groupOp));
    }
    return collected;
  }

  return [];
}

/**
 * Extracts mandatory scheme-specific conditions from `root_group.additionalConditions`
 * (or nested `VERIFICATION` nodes) that cannot be evaluated automatically from basic
 * citizen profile fields and require manual/document/portal verification.
 */
export function extractAdditionalConditionsFromRootGroup(
  rootGroup: Json | null | undefined
): AdditionalVerificationCondition[] {
  if (!rootGroup || typeof rootGroup !== "object" || Array.isArray(rootGroup)) {
    return [];
  }

  const node = rootGroup as Record<string, Json | undefined>;
  const collected: AdditionalVerificationCondition[] = [];

  if (Array.isArray(node.additionalConditions)) {
    for (let idx = 0; idx < node.additionalConditions.length; idx++) {
      const item = node.additionalConditions[idx];
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const record = item as Record<string, Json | undefined>;
        const id =
          typeof record.id === "string" && record.id.trim().length > 0
            ? record.id.trim()
            : `additional-cond-${idx + 1}`;
        const label_en =
          typeof record.label_en === "string" ? record.label_en.trim() : "";
        const label_ta =
          typeof record.label_ta === "string" && record.label_ta.trim().length > 0
            ? record.label_ta.trim()
            : label_en;

        if (label_en.length > 0) {
          collected.push({ id, label_en, label_ta });
        }
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (let idx = 0; idx < node.children.length; idx++) {
      const child = node.children[idx];
      if (child && typeof child === "object" && !Array.isArray(child)) {
        const childObj = child as Record<string, Json | undefined>;
        if (childObj.type === "VERIFICATION") {
          const id =
            typeof childObj.id === "string" && childObj.id.trim().length > 0
              ? childObj.id.trim()
              : `verify-node-${idx + 1}`;
          const label_en =
            typeof childObj.label_en === "string" ? childObj.label_en.trim() : "";
          const label_ta =
            typeof childObj.label_ta === "string" &&
            childObj.label_ta.trim().length > 0
              ? childObj.label_ta.trim()
              : label_en;
          if (label_en.length > 0) {
            collected.push({ id, label_en, label_ta });
          }
        } else if (childObj.type === "GROUP") {
          collected.push(...extractAdditionalConditionsFromRootGroup(child));
        }
      }
    }
  }

  return collected;
}

/**
 * Deterministic filter function used both on server-side results and client-side instant filtering.
 * Enforces that only active, verified schemes with a valid verification timestamp are returned.
 */
export function filterSchemes(
  schemes: SchemeListItem[],
  rawFilters: Partial<SchemeFilterParams>
): SchemeListItem[] {
  const parsed = SchemeFilterParamsSchema.safeParse(rawFilters);
  const filters: SchemeFilterParams = parsed.success
    ? parsed.data
    : {
        q: "",
        category: "all",
        level: "all",
        state: "all",
        audience: "all",
      };

  const queryLower = filters.q.toLowerCase();

  return schemes.filter((scheme) => {
    // Safety guard: never return unverified or archived schemes
    if (!scheme.is_verified || scheme.status !== "active" || !scheme.last_verified_at) {
      return false;
    }

    if (filters.category !== "all" && scheme.category.slug !== filters.category) {
      return false;
    }

    if (filters.level !== "all" && scheme.government_level !== filters.level) {
      return false;
    }

    if (filters.state !== "all" && scheme.state_code !== filters.state) {
      return false;
    }

    if (
      filters.audience !== "all" &&
      !scheme.target_audiences.includes(filters.audience)
    ) {
      return false;
    }

    if (queryLower.length > 0) {
      const searchableText = [
        scheme.name_en,
        scheme.name_ta,
        scheme.short_description_en,
        scheme.short_description_ta,
        scheme.benefits_en,
        scheme.benefits_ta,
        scheme.department_en,
        scheme.department_ta,
        scheme.category.name_en,
        scheme.category.name_ta,
        scheme.slug,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(queryLower)) {
        return false;
      }
    }

    return true;
  });
}
