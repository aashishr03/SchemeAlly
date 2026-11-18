import type { AppSupabaseClient, Json } from "@/types/database";
import {
  extractAdditionalConditionsFromRootGroup,
  extractConditionsFromRootGroup,
  filterSchemes,
  SchemeFilterParamsSchema,
  SchemeSlugSchema,
  type SchemeCatalogueResult,
  type SchemeCategorySummary,
  type SchemeDetailItem,
  type SchemeEligibilityRuleDetail,
  type SchemeFilterParams,
  type SchemeListItem,
} from "@/services/scheme/schema";

export class SchemeRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listCategories(): Promise<SchemeCategorySummary[]> {
    const { data, error } = await this.supabase
      .from("scheme_categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch scheme categories: ${error.message}`);
    }

    return (data ?? []).map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name_en: cat.name_en,
      name_ta: cat.name_ta,
      description_en: cat.description_en,
      description_ta: cat.description_ta,
      icon: cat.icon,
      display_order: cat.display_order,
    }));
  }

  async getCatalogue(
    rawFilters?: Partial<SchemeFilterParams>
  ): Promise<SchemeCatalogueResult> {
    const parsedFilters = SchemeFilterParamsSchema.safeParse(rawFilters ?? {});
    const appliedFilters: SchemeFilterParams = parsedFilters.success
      ? parsedFilters.data
      : {
          q: "",
          category: "all",
          level: "all",
          state: "all",
          audience: "all",
        };

    const [categoriesResult, schemesResult, requiredDocsResult] =
      await Promise.all([
        this.supabase
          .from("scheme_categories")
          .select("*")
          .order("display_order", { ascending: true }),
        this.supabase
          .from("schemes")
          .select("*")
          .eq("status", "active")
          .eq("is_verified", true)
          .order("name_en", { ascending: true }),
        this.supabase
          .from("scheme_required_documents")
          .select("scheme_id, is_mandatory")
          .eq("is_mandatory", true),
      ]);

    if (categoriesResult.error) {
      throw new Error(
        `Failed to fetch scheme categories: ${categoriesResult.error.message}`
      );
    }
    if (schemesResult.error) {
      throw new Error(
        `Failed to fetch published schemes: ${schemesResult.error.message}`
      );
    }
    if (requiredDocsResult.error) {
      throw new Error(
        `Failed to fetch required document counts: ${requiredDocsResult.error.message}`
      );
    }

    const categoryRows = categoriesResult.data ?? [];
    const schemeRows = (schemesResult.data ?? []).filter(
      (s) => s.is_verified === true && s.status === "active" && Boolean(s.last_verified_at)
    );
    const mandatoryDocRows = requiredDocsResult.data ?? [];

    const categoryById = new Map(categoryRows.map((cat) => [cat.id, cat]));
    const mandatoryCountBySchemeId = new Map<string, number>();

    for (const doc of mandatoryDocRows) {
      if (doc.is_mandatory) {
        mandatoryCountBySchemeId.set(
          doc.scheme_id,
          (mandatoryCountBySchemeId.get(doc.scheme_id) ?? 0) + 1
        );
      }
    }

    const schemeCountByCategoryId = new Map<string, number>();
    const allVerifiedSchemeItems: SchemeListItem[] = [];

    for (const row of schemeRows) {
      const cat = categoryById.get(row.category_id);
      if (!cat) continue;

      schemeCountByCategoryId.set(
        cat.id,
        (schemeCountByCategoryId.get(cat.id) ?? 0) + 1
      );

      allVerifiedSchemeItems.push({
        id: row.id,
        slug: row.slug,
        category_id: row.category_id,
        category: {
          id: cat.id,
          slug: cat.slug,
          name_en: cat.name_en,
          name_ta: cat.name_ta,
          icon: cat.icon,
        },
        name_en: row.name_en,
        name_ta: row.name_ta,
        short_description_en: row.short_description_en,
        short_description_ta: row.short_description_ta,
        benefits_en: row.benefits_en,
        benefits_ta: row.benefits_ta,
        department_en: row.department_en,
        department_ta: row.department_ta,
        government_level: row.government_level,
        state_code: row.state_code,
        target_audiences: row.target_audiences ?? [],
        official_source_url: row.official_source_url,
        official_application_url: row.official_application_url,
        last_verified_at: row.last_verified_at,
        is_verified: row.is_verified,
        status: row.status,
        mandatory_documents_count: mandatoryCountBySchemeId.get(row.id) ?? 0,
      });
    }

    const categories: SchemeCategorySummary[] = categoryRows.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name_en: cat.name_en,
      name_ta: cat.name_ta,
      description_en: cat.description_en,
      description_ta: cat.description_ta,
      icon: cat.icon,
      display_order: cat.display_order,
      scheme_count: schemeCountByCategoryId.get(cat.id) ?? 0,
    }));

    const filteredSchemes = filterSchemes(
      allVerifiedSchemeItems,
      appliedFilters
    );

    return {
      categories,
      schemes: filteredSchemes,
      totalVerifiedCount: allVerifiedSchemeItems.length,
      appliedFilters,
    };
  }

  /**
   * Active eligibility rules for published schemes. Uses the caller's
   * (anon/authenticated) client, so existing RLS limits rows to published schemes.
   */
  async listActiveRules(): Promise<
    { scheme_id: string; rule_version: number; root_group: Json }[]
  > {
    const { data, error } = await this.supabase
      .from("scheme_eligibility_rules")
      .select("scheme_id, rule_version, root_group")
      .eq("is_active", true);

    if (error) {
      throw new Error(`Failed to fetch active eligibility rules: ${error.message}`);
    }
    return data ?? [];
  }

  async getPublishedSchemeBySlug(
    rawSlug: string
  ): Promise<SchemeDetailItem | null> {
    const slugParsed = SchemeSlugSchema.safeParse(rawSlug);
    if (!slugParsed.success) {
      return null;
    }

    const { data: schemeRow, error: schemeErr } = await this.supabase
      .from("schemes")
      .select("*")
      .eq("slug", slugParsed.data)
      .eq("status", "active")
      .eq("is_verified", true)
      .maybeSingle();

    if (schemeErr) {
      throw new Error(`Failed to fetch scheme details: ${schemeErr.message}`);
    }

    if (
      !schemeRow ||
      !schemeRow.is_verified ||
      schemeRow.status !== "active" ||
      !schemeRow.last_verified_at
    ) {
      return null;
    }

    const [catResult, rulesResult, docsResult, stepsResult, sourcesResult] =
      await Promise.all([
        this.supabase
          .from("scheme_categories")
          .select("*")
          .eq("id", schemeRow.category_id)
          .maybeSingle(),
        this.supabase
          .from("scheme_eligibility_rules")
          .select("*")
          .eq("scheme_id", schemeRow.id)
          .eq("is_active", true)
          .order("rule_version", { ascending: false })
          .limit(1),
        this.supabase
          .from("scheme_required_documents")
          .select("*")
          .eq("scheme_id", schemeRow.id)
          .order("display_order", { ascending: true }),
        this.supabase
          .from("scheme_application_steps")
          .select("*")
          .eq("scheme_id", schemeRow.id)
          .order("step_number", { ascending: true }),
        this.supabase
          .from("scheme_sources")
          .select("*")
          .eq("scheme_id", schemeRow.id)
          .order("verified_at", { ascending: false }),
      ]);

    if (catResult.error) {
      throw new Error(
        `Failed to fetch scheme category: ${catResult.error.message}`
      );
    }
    if (rulesResult.error) {
      throw new Error(
        `Failed to fetch scheme eligibility rules: ${rulesResult.error.message}`
      );
    }
    if (docsResult.error) {
      throw new Error(
        `Failed to fetch scheme required documents: ${docsResult.error.message}`
      );
    }
    if (stepsResult.error) {
      throw new Error(
        `Failed to fetch scheme application steps: ${stepsResult.error.message}`
      );
    }
    if (sourcesResult.error) {
      throw new Error(
        `Failed to fetch scheme sources: ${sourcesResult.error.message}`
      );
    }

    if (!catResult.data) {
      return null;
    }

    const activeRuleRow = rulesResult.data?.[0] ?? null;
    let eligibilityRule: SchemeEligibilityRuleDetail | null = null;

    if (activeRuleRow) {
      const rootObj =
        activeRuleRow.root_group &&
        typeof activeRuleRow.root_group === "object" &&
        !Array.isArray(activeRuleRow.root_group)
          ? (activeRuleRow.root_group as Record<string, unknown>)
          : null;
      const rootLogicalOp: "AND" | "OR" =
        rootObj?.logicalOperator === "OR" ? "OR" : "AND";

      eligibilityRule = {
        id: activeRuleRow.id,
        rule_version: activeRuleRow.rule_version,
        is_active: activeRuleRow.is_active,
        root_group: activeRuleRow.root_group,
        root_logical_operator: rootLogicalOp,
        summary_en: activeRuleRow.summary_en,
        summary_ta: activeRuleRow.summary_ta,
        conditions: extractConditionsFromRootGroup(
          activeRuleRow.root_group,
          rootLogicalOp
        ),
        additional_conditions: extractAdditionalConditionsFromRootGroup(
          activeRuleRow.root_group
        ),
      };
    }

    const requiredDocuments = (docsResult.data ?? []).map((doc) => ({
      id: doc.id,
      document_type_code: doc.document_type_code,
      name_en: doc.name_en,
      name_ta: doc.name_ta,
      description_en: doc.description_en,
      description_ta: doc.description_ta,
      is_mandatory: doc.is_mandatory,
      requires_unexpired: doc.requires_unexpired,
      display_order: doc.display_order,
    }));

    const applicationSteps = (stepsResult.data ?? []).map((step) => ({
      id: step.id,
      step_number: step.step_number,
      title_en: step.title_en,
      title_ta: step.title_ta,
      description_en: step.description_en,
      description_ta: step.description_ta,
    }));

    const sources = (sourcesResult.data ?? []).map((src) => ({
      id: src.id,
      source_title: src.source_title,
      source_url: src.source_url,
      source_type: src.source_type,
      verified_at: src.verified_at,
    }));

    return {
      id: schemeRow.id,
      slug: schemeRow.slug,
      category_id: schemeRow.category_id,
      category: {
        id: catResult.data.id,
        slug: catResult.data.slug,
        name_en: catResult.data.name_en,
        name_ta: catResult.data.name_ta,
        icon: catResult.data.icon,
      },
      name_en: schemeRow.name_en,
      name_ta: schemeRow.name_ta,
      short_description_en: schemeRow.short_description_en,
      short_description_ta: schemeRow.short_description_ta,
      detailed_description_en: schemeRow.detailed_description_en,
      detailed_description_ta: schemeRow.detailed_description_ta,
      benefits_en: schemeRow.benefits_en,
      benefits_ta: schemeRow.benefits_ta,
      department_en: schemeRow.department_en,
      department_ta: schemeRow.department_ta,
      government_level: schemeRow.government_level,
      state_code: schemeRow.state_code,
      target_audiences: schemeRow.target_audiences ?? [],
      application_instructions_en: schemeRow.application_instructions_en,
      application_instructions_ta: schemeRow.application_instructions_ta,
      official_source_url: schemeRow.official_source_url,
      official_application_url: schemeRow.official_application_url,
      last_verified_at: schemeRow.last_verified_at,
      is_verified: schemeRow.is_verified,
      status: schemeRow.status,
      mandatory_documents_count: requiredDocuments.filter(
        (d) => d.is_mandatory
      ).length,
      eligibility_rule: eligibilityRule,
      required_documents: requiredDocuments,
      application_steps: applicationSteps,
      sources,
    };
  }
}
