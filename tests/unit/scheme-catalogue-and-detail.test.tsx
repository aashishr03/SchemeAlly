import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { Navbar } from "@/components/layout/Navbar";
import { SchemeCatalogClient } from "@/components/schemes/SchemeCatalogClient";
import { SchemeDetailClient } from "@/components/schemes/SchemeDetailClient";
import SchemeNotFound from "@/app/(public)/schemes/[slug]/not-found";
import { SchemeRepository } from "@/infrastructure/repositories/scheme-repository";
import type { AppSupabaseClient } from "@/types/database";
import { evaluateSchemeEligibility } from "@/core/eligibility";
import {
  extractAdditionalConditionsFromRootGroup,
  extractConditionsFromRootGroup,
  filterSchemes,
  sanitizeSearchQuery,
  SchemeFilterParamsSchema,
  SchemeSlugSchema,
  getSchemeDetailHref,
  type SchemeCategorySummary,
  type SchemeDetailItem,
  type SchemeListItem,
} from "@/services/scheme/schema";

vi.mock("next/navigation", () => ({
  usePathname: () => "/discover",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/infrastructure/supabase/env", () => ({
  isSupabaseConfigured: () => false,
}));

vi.mock("@/components/schemes/SavedSchemesProvider", () => ({
  SavedSchemesRequestError: class SavedSchemesRequestError extends Error {
    status = 500;
  },
  useSavedSchemes: () => ({
    items: [],
    isLoading: false,
    error: null,
    isSaved: () => false,
    isPending: () => false,
    save: vi.fn(),
    remove: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const MOCK_CATEGORIES: SchemeCategorySummary[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "education",
    name_en: "Education",
    name_ta: "கல்வி",
    description_en: "Higher education and scholarships",
    description_ta: "உயர்கல்வி மற்றும் உதவித்தொகை",
    icon: "GraduationCap",
    display_order: 1,
    scheme_count: 1,
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    slug: "agriculture",
    name_en: "Agriculture",
    name_ta: "வேளாண்மை",
    description_en: "Farmer income support",
    description_ta: "விவசாயிகள் வருமான ஆதரவு",
    icon: "Sprout",
    display_order: 5,
    scheme_count: 1,
  },
];

const MOCK_SCHEMES: SchemeListItem[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    slug: "pudhumai-penn-scheme",
    category_id: "10000000-0000-4000-8000-000000000001",
    category: {
      id: "10000000-0000-4000-8000-000000000001",
      slug: "education",
      name_en: "Education",
      name_ta: "கல்வி",
      icon: "GraduationCap",
    },
    name_en:
      "Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme (Pudhumai Penn)",
    name_ta:
      "மூவலூர் இராமாமிர்தம் அம்மையார் உயர்கல்வி உறுதித் திட்டம் (புதுமைப் பெண்)",
    short_description_en:
      "Monthly financial assistance of ₹1,000 for girl students who studied Classes 6 to 12 in government schools.",
    short_description_ta:
      "அரசுப் பள்ளிகளில் 6 முதல் 12-ஆம் வகுப்பு வரை பயின்று உயர்கல்வி பயிலும் மாணவிகளுக்கு மாதம் ₹1,000 நிதியுதவி.",
    benefits_en: "₹1,000 per month transferred directly to bank account.",
    benefits_ta: "மாதம் ₹1,000 நேரடியாக வங்கிக் கணக்கில் செலுத்தப்படும்.",
    department_en:
      "Social Welfare and Women Empowerment Department, Government of Tamil Nadu",
    department_ta: "சமூக நலன் மற்றும் மகளிர் உரிமைத் துறை, தமிழ்நாடு அரசு",
    government_level: "state",
    state_code: "TN",
    target_audiences: ["students", "women"],
    official_source_url: "https://www.pudhumaipenn.tn.gov.in/",
    official_application_url: "https://umis.tn.gov.in/",
    last_verified_at: "2026-11-15T00:00:00Z",
    is_verified: true,
    status: "active",
    mandatory_documents_count: 3,
  },
  {
    id: "20000000-0000-4000-8000-000000000009",
    slug: "pm-kisan-samman-nidhi",
    category_id: "10000000-0000-4000-8000-000000000005",
    category: {
      id: "10000000-0000-4000-8000-000000000005",
      slug: "agriculture",
      name_en: "Agriculture",
      name_ta: "வேளாண்மை",
      icon: "Sprout",
    },
    name_en: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    name_ta: "பிரதான் மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)",
    short_description_en:
      "Annual income support of ₹6,000 in three equal instalments for landholding farmer families.",
    short_description_ta:
      "வேளாண் நிலம் வைத்துள்ள விவசாயக் குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000 நேரடி வருமான ஆதரவு.",
    benefits_en: "₹6,000 per year (₹2,000 every four months) via DBT.",
    benefits_ta: "ஆண்டுக்கு ₹6,000 நேரடி வங்கிப் பரிமாற்றம்.",
    department_en:
      "Ministry of Agriculture and Farmers Welfare, Government of India",
    department_ta: "வேளாண்மை மற்றும் உழவர் நல அமைச்சகம், இந்திய அரசு",
    government_level: "central",
    state_code: "ALL",
    target_audiences: ["farmers"],
    official_source_url: "https://pmkisan.gov.in/",
    official_application_url:
      "https://pmkisan.gov.in/RegistrationFormNew.aspx",
    last_verified_at: "2026-11-15T00:00:00Z",
    is_verified: true,
    status: "active",
    mandatory_documents_count: 2,
  },
];

const MOCK_SCHEME_DETAIL: SchemeDetailItem = {
  ...MOCK_SCHEMES[0],
  detailed_description_en:
    "Launched by the Government of Tamil Nadu to increase higher education enrolment among girls from government schools.",
  detailed_description_ta:
    "அரசுப் பள்ளிகளில் பயிலும் மாணவிகளின் உயர்கல்விச் சேர்க்கையை அதிகரிக்கும் நோக்கில் தமிழ்நாடு அரசால் தொடங்கப்பட்ட திட்டம்.",
  application_instructions_en:
    "Applications are submitted through the UMIS portal via the college nodal officer.",
  application_instructions_ta:
    "கல்லூரியின் ஒருங்கிணைப்பு அலுவலர் மூலம் UMIS தளத்தில் விண்ணப்பிக்கலாம்.",
  eligibility_rule: {
    id: "rule-1",
    rule_version: 1,
    is_active: true,
    root_logical_operator: "AND",
    root_group: {
      type: "GROUP",
      id: "root",
      logicalOperator: "AND",
      children: [
        {
          type: "CONDITION",
          id: "cond-state",
          field: "state",
          operator: "EQUALS",
          value: "Tamil Nadu",
          label_en: "Resident of Tamil Nadu",
          label_ta: "தமிழ்நாடு மாநிலத்தில் வசிப்பவர்",
        },
        {
          type: "CONDITION",
          id: "cond-gender",
          field: "gender",
          operator: "EQUALS",
          value: "female",
          label_en: "Applicant is a female student",
          label_ta: "விண்ணப்பதாரர் மாணவியாக இருக்க வேண்டும்",
        },
      ],
      additionalConditions: [
        {
          id: "verify-govt-school-6-12",
          label_en:
            "Studied continuously from Class 6 to Class 12 in a Tamil Nadu Government school (verified via school EMIS ID)",
          label_ta:
            "தமிழ்நாடு அரசுப் பள்ளியில் 6 முதல் 12-ஆம் வகுப்பு வரை தொடர்ந்து பயின்றிருக்க வேண்டும் (EMIS எண் மூலம் சரிபார்க்கப்படும்)",
        },
      ],
    },
    summary_en:
      "Girl students residing in Tamil Nadu who studied Classes 6 to 12 in Government schools.",
    summary_ta:
      "தமிழ்நாட்டில் அரசுப் பள்ளிகளில் 6 முதல் 12-ஆம் வகுப்பு வரை பயின்ற மாணவிகள்.",
    conditions: [
      {
        id: "cond-state",
        field: "state",
        operator: "EQUALS",
        value: "Tamil Nadu",
        label_en: "Resident of Tamil Nadu",
        label_ta: "தமிழ்நாடு மாநிலத்தில் வசிப்பவர்",
        groupOperator: "AND",
      },
      {
        id: "cond-gender",
        field: "gender",
        operator: "EQUALS",
        value: "female",
        label_en: "Applicant is a female student",
        label_ta: "விண்ணப்பதாரர் மாணவியாக இருக்க வேண்டும்",
        groupOperator: "AND",
      },
    ],
    additional_conditions: [
      {
        id: "verify-govt-school-6-12",
        label_en:
          "Studied continuously from Class 6 to Class 12 in a Tamil Nadu Government school (verified via school EMIS ID)",
        label_ta:
          "தமிழ்நாடு அரசுப் பள்ளியில் 6 முதல் 12-ஆம் வகுப்பு வரை தொடர்ந்து பயின்றிருக்க வேண்டும் (EMIS எண் மூலம் சரிபார்க்கப்படும்)",
      },
    ],
  },
  required_documents: [
    {
      id: "doc-1",
      document_type_code: "BONAFIDE_CERTIFICATE",
      name_en: "College Bonafide Certificate",
      name_ta: "கல்லூரிப் பயிலும் சான்றிதழ்",
      description_en: "Proof of current admission in an undergraduate course.",
      description_ta: "இளங்கலைப் படிப்பில் பயில்வதற்கான சான்று.",
      is_mandatory: true,
      requires_unexpired: true,
      display_order: 1,
    },
  ],
  application_steps: [
    {
      id: "step-1",
      step_number: 1,
      title_en: "Verify School EMIS Number",
      title_ta: "பள்ளி EMIS எண்ணைச் சரிபார்த்தல்",
      description_en:
        "Confirm your Class 6 to Class 12 Government school attendance record.",
      description_ta:
        "6 முதல் 12-ஆம் வகுப்பு வரை அரசுப் பள்ளியில் பயின்ற EMIS எண்ணை உறுதிப்படுத்தவும்.",
    },
  ],
  sources: [
    {
      id: "src-1",
      source_title: "Pudhumai Penn Official Portal — Govt of Tamil Nadu",
      source_url: "https://www.pudhumaipenn.tn.gov.in/",
      source_type: "official_portal",
      verified_at: "2026-11-15T00:00:00Z",
    },
  ],
};

function getSeededSchemeSlugs(): string[] {
  const seedSql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20261115000004_scheme_catalogue_seed.sql"
    ),
    "utf8"
  );
  const insertStart = seedSql.indexOf("INSERT INTO public.schemes (");
  const upsertStart = seedSql.indexOf(
    "ON CONFLICT (slug) DO UPDATE SET",
    insertStart
  );
  const schemeValues = seedSql.slice(insertStart, upsertStart);
  return Array.from(
    schemeValues.matchAll(
      /^\s*\(\s*'20000000-[^']+'\s*,\s*'([^']+)'/gm
    ),
    (match) => match[1]
  );
}

function createSchemeLookupClient(slug: string): AppSupabaseClient {
  const schemeRow = { ...MOCK_SCHEME_DETAIL, slug };
  const queryResult = (table: string) => ({
    data:
      table === "schemes"
        ? schemeRow
        : table === "scheme_categories"
          ? MOCK_SCHEME_DETAIL.category
          : [],
    error: null,
  });

  const from = (table: string) => {
    const query = {} as {
      select: (...columns: string[]) => typeof query;
      eq: (column: string, value: unknown) => typeof query;
      order: (column: string, options?: unknown) => typeof query;
      limit: (count: number) => typeof query;
      maybeSingle: () => Promise<ReturnType<typeof queryResult>>;
      then: (
        resolve: (value: { data: unknown[]; error: null }) => unknown,
        reject?: (reason: unknown) => unknown
      ) => Promise<unknown>;
    };
    query.select = () => query;
    query.eq = () => query;
    query.order = () => query;
    query.limit = () => query;
    query.maybeSingle = async () => queryResult(table);
    query.then = (resolve, reject) =>
      Promise.resolve({ data: [], error: null }).then(resolve, reject);
    return query;
  };

  return { from } as unknown as AppSupabaseClient;
}

describe("Phase 4 — Scheme Catalogue Validation, Filtering, Discovery & Detail UI", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("validates scheme slugs and sanitizes filter parameters safely", () => {
    expect(SchemeSlugSchema.safeParse("pudhumai-penn-scheme").success).toBe(
      true
    );
    expect(SchemeSlugSchema.safeParse("../invalid_slug!").success).toBe(false);
    expect(SchemeSlugSchema.safeParse("").success).toBe(false);

    expect(sanitizeSearchQuery("  Pudhumai, (Penn)%*\\  ")).toBe(
      "Pudhumai Penn"
    );

    const parsedFilter = SchemeFilterParamsSchema.parse({
      q: "  PM-KISAN (test) ",
      category: "agriculture",
      level: "central",
      state: "ALL",
      audience: "farmers",
    });
    expect(parsedFilter).toEqual({
      q: "PM-KISAN test",
      category: "agriculture",
      level: "central",
      state: "ALL",
      audience: "farmers",
    });
  });

  it("extracts nested AND/OR eligibility condition previews from root_group JSONB", () => {
    const conditions = extractConditionsFromRootGroup({
      type: "GROUP",
      id: "root",
      logicalOperator: "AND",
      children: [
        {
          type: "CONDITION",
          id: "c1",
          field: "state",
          operator: "EQUALS",
          value: "Tamil Nadu",
          label_en: "Resident of Tamil Nadu",
          label_ta: "தமிழ்நாட்டில் வசிப்பவர்",
        },
        {
          type: "GROUP",
          id: "or-sub",
          logicalOperator: "OR",
          children: [
            {
              type: "CONDITION",
              id: "c2",
              field: "is_student",
              operator: "EQUALS",
              value: true,
              label_en: "Enrolled student",
              label_ta: "மாணவர்",
            },
          ],
        },
      ],
    });

    expect(conditions).toHaveLength(2);
    expect(conditions[0].groupOperator).toBe("AND");
    expect(conditions[1].groupOperator).toBe("OR");
  });

  it("excludes unverified or archived schemes and filters by search, category, level, state, and audience", () => {
    const unverifiedScheme: SchemeListItem = {
      ...MOCK_SCHEMES[0],
      id: "unverified-1",
      slug: "unverified-scheme",
      is_verified: false,
      last_verified_at: null,
    };
    const archivedScheme: SchemeListItem = {
      ...MOCK_SCHEMES[1],
      id: "archived-1",
      slug: "archived-scheme",
      status: "archived",
    };

    const combined = [...MOCK_SCHEMES, unverifiedScheme, archivedScheme];

    // Default filter never returns unverified or archived schemes
    const allActiveVerified = filterSchemes(combined, {});
    expect(allActiveVerified).toHaveLength(2);

    // Search by Tamil keyword
    const tamilSearch = filterSchemes(combined, { q: "புதுமைப் பெண்" });
    expect(tamilSearch.map((s) => s.slug)).toEqual(["pudhumai-penn-scheme"]);

    // Filter by Central Government level
    const centralOnly = filterSchemes(combined, { level: "central" });
    expect(centralOnly.map((s) => s.slug)).toEqual(["pm-kisan-samman-nidhi"]);

    // Filter by category + audience
    const farmers = filterSchemes(combined, {
      category: "agriculture",
      audience: "farmers",
    });
    expect(farmers.map((s) => s.slug)).toEqual(["pm-kisan-samman-nidhi"]);
  });

  it("renders SchemeCatalogClient with interactive search, filters, empty state, and Tamil switching", () => {
    render(
      <LanguageProvider>
        <Navbar />
        <SchemeCatalogClient
          categories={MOCK_CATEGORIES}
          allSchemes={MOCK_SCHEMES.map((scheme, index) => ({
            ...scheme,
            last_verified_at:
              index === 0 ? "2025-11-15T00:00:00Z" : "2026-11-15T00:00:00Z",
          }))}
          initialFilters={{
            q: "",
            category: "all",
            level: "all",
            state: "all",
            audience: "all",
          }}
        />
      </LanguageProvider>
    );

    expect(
      screen.getByText("Discover Government Welfare Schemes")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("scheme-card-pudhumai-penn-scheme")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("scheme-card-pm-kisan-samman-nidhi")
    ).toBeInTheDocument();
    const advancedFilters = screen.getByText("More filters").closest("details");
    expect(advancedFilters).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("More filters"));
    expect(advancedFilters).toHaveAttribute("open");
    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: "recent" },
    });
    expect(screen.getAllByTestId(/^scheme-card-/)[0]).toHaveAttribute(
      "data-testid",
      "scheme-card-pm-kisan-samman-nidhi"
    );

    // Filter by Central Govt button
    const centralBtn = screen.getByRole("button", { name: "Central Govt" });
    fireEvent.click(centralBtn);
    expect(
      screen.queryByTestId("scheme-card-pudhumai-penn-scheme")
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("scheme-card-pm-kisan-samman-nidhi")
    ).toBeInTheDocument();

    // Search for a non-existent term -> verify empty state and reset button
    const searchInput = screen.getByRole("searchbox", {
      name: /Search government schemes/i,
    });
    fireEvent.change(searchInput, {
      target: { value: "nonexistent-scheme-xyz" },
    });
    expect(
      screen.getByText("No verified schemes match your current filters")
    ).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", {
      name: "Show All Verified Schemes",
    });
    fireEvent.click(resetBtn);
    expect(
      screen.getByTestId("scheme-card-pudhumai-penn-scheme")
    ).toBeInTheDocument();

    // Switch to Tamil and verify Tamil headings and scheme title
    const langBtn = screen.getByRole("button", {
      name: /Switch language between English and Tamil/i,
    });
    fireEvent.click(langBtn);

    expect(
      screen.getByText("அரசு நலத்திட்டங்களைக் கண்டறியுங்கள்")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "மூவலூர் இராமாமிர்தம் அம்மையார் உயர்கல்வி உறுதித் திட்டம் (புதுமைப் பெண்)"
      )
    ).toBeInTheDocument();
  });

  it("shows account actions when the server session is authenticated", () => {
    render(
      <LanguageProvider>
        <AuthSessionProvider
          initialUser={{ id: "citizen-1", email: null, displayName: null }}
        >
          <Navbar />
        </AuthSessionProvider>
      </LanguageProvider>
    );

    expect(
      screen.getByRole("link", { name: "My Profile" })
    ).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("encodes links and retrieves detail records for all 18 seeded scheme slugs", async () => {
    const slugs = getSeededSchemeSlugs();
    expect(slugs).toHaveLength(18);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => SchemeSlugSchema.safeParse(slug).success)).toBe(
      true
    );

    const schemes = slugs.map((slug, index) => ({
      ...MOCK_SCHEMES[0],
      id: `seeded-scheme-${index + 1}`,
      slug,
    }));
    render(
      <LanguageProvider>
        <SchemeCatalogClient
          categories={MOCK_CATEGORIES}
          allSchemes={schemes}
          initialFilters={{
            q: "",
            category: "all",
            level: "all",
            state: "all",
            audience: "all",
          }}
        />
      </LanguageProvider>
    );

    for (const slug of slugs) {
      const card = screen.getByTestId(`scheme-card-${slug}`);
      const detailLinks = within(card)
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href") === getSchemeDetailHref(slug));
      expect(detailLinks).toHaveLength(2);
    }

    const repositoryResults = await Promise.all(
      slugs.map((slug) =>
        new SchemeRepository(createSchemeLookupClient(slug)).getPublishedSchemeBySlug(
          slug
        )
      )
    );
    expect(repositoryResults.map((scheme) => scheme?.slug)).toEqual(slugs);
  });

  it("renders SchemeDetailClient with structured eligibility rules, required documents, steps, and official links in English and Tamil", () => {
    render(
      <LanguageProvider>
        <Navbar />
        <SchemeDetailClient scheme={MOCK_SCHEME_DETAIL} />
      </LanguageProvider>
    );

    expect(
      screen.getByRole("heading", {
        name: /Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Resident of Tamil Nadu")).toBeInTheDocument();
    expect(screen.getByText("College Bonafide Certificate")).toBeInTheDocument();
    expect(screen.getByText("Verify School EMIS Number")).toBeInTheDocument();
    expect(
      screen.getByText("Pudhumai Penn Official Portal — Govt of Tamil Nadu")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "On this page" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Required Documents Checklist" })
    ).toHaveAttribute("href", "#documents");
    expect(document.getElementById("eligibility")).toBeInTheDocument();

    // Switch language to Tamil
    const langBtn = screen.getByRole("button", {
      name: /Switch language between English and Tamil/i,
    });
    fireEvent.click(langBtn);

    expect(
      screen.getByRole("heading", {
        name: /மூவலூர் இராமாமிர்தம் அம்மையார் உயர்கல்வி உறுதித் திட்டம்/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("தமிழ்நாடு மாநிலத்தில் வசிப்பவர்")).toBeInTheDocument();
    expect(screen.getByText("கல்லூரிப் பயிலும் சான்றிதழ்")).toBeInTheDocument();
    expect(screen.getByText("பள்ளி EMIS எண்ணைச் சரிபார்த்தல்")).toBeInTheDocument();
  });

  it("renders 'No document requirements configured.' when required_documents is empty", () => {
    render(
      <LanguageProvider>
        <SchemeDetailClient
          scheme={{
            ...MOCK_SCHEME_DETAIL,
            required_documents: [],
            mandatory_documents_count: 0,
          }}
        />
      </LanguageProvider>
    );

    expect(
      screen.getByText("No document requirements configured.")
    ).toBeInTheDocument();
  });

  it("returns null from SchemeRepository.getPublishedSchemeBySlug for invalid or missing scheme slugs", async () => {
    const fakeSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as AppSupabaseClient;

    const repo = new SchemeRepository(fakeSupabase);

    // Invalid slug rejected before DB query
    expect(await repo.getPublishedSchemeBySlug("INVALID SLUG!!")).toBeNull();

    // Missing or unverified scheme slug returns null
    expect(await repo.getPublishedSchemeBySlug("missing-scheme")).toBeNull();
  });

  it("renders the scheme-specific not-found state for unavailable slugs", () => {
    render(
      <LanguageProvider>
        <SchemeNotFound />
      </LanguageProvider>
    );

    expect(
      screen.getByRole("heading", {
        name: "This scheme is unavailable or has not been verified",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse Verified Schemes" })
    ).toHaveAttribute("href", "/discover");
  });

  it("proves a partial profile match never produces a definitive ELIGIBLE result when additional scheme-specific conditions remain unverified", () => {
    const ruleRootGroup = MOCK_SCHEME_DETAIL.eligibility_rule!.root_group;

    // 1. All automated profile conditions match, but `verify-govt-school-6-12` is unverified -> POTENTIAL_MATCH
    const partialMatchEval = evaluateSchemeEligibility(
      {
        state: "Tamil Nadu",
        gender: "female",
      },
      ruleRootGroup,
      { ruleVersion: 1 }
    );

    expect(partialMatchEval.outcome).toBe("POTENTIAL_MATCH");
    expect(partialMatchEval.outcome).not.toBe("ELIGIBLE");
    expect(partialMatchEval.engineStatus).toBe("NEEDS_VERIFICATION");
    expect(partialMatchEval.isDefinitivelyEligible).toBe(false);
    expect(partialMatchEval.outcomeTitle_en).toBe("Potential Match");
    expect(partialMatchEval.outcomeDescription_en).toBe(
      "Basic profile conditions match, but additional scheme-specific conditions require verification."
    );
    expect(partialMatchEval.unverifiedAdditionalConditions).toHaveLength(1);
    expect(partialMatchEval.unverifiedAdditionalConditions[0].id).toBe(
      "verify-govt-school-6-12"
    );

    // 2. When a confirmed mandatory condition fails -> NOT_ELIGIBLE
    const failedEval = evaluateSchemeEligibility(
      {
        state: "Kerala",
        gender: "female",
      },
      ruleRootGroup,
      { ruleVersion: 1 }
    );
    expect(failedEval.outcome).toBe("NOT_ELIGIBLE");
    expect(failedEval.isDefinitivelyEligible).toBe(false);
    expect(failedEval.outcomeTitle_en).toBe("Not Eligible");

    // 3. When required profile information is missing -> INSUFFICIENT_INFORMATION
    const missingEval = evaluateSchemeEligibility(
      {
        state: "Tamil Nadu",
        gender: null,
      },
      ruleRootGroup,
      { ruleVersion: 1 }
    );
    expect(missingEval.outcome).toBe("INSUFFICIENT_INFORMATION");
    expect(missingEval.isDefinitivelyEligible).toBe(false);
    expect(missingEval.missingFields).toEqual(["gender"]);

    // 4. Only when all automated conditions pass AND every additional condition is explicitly verified -> ELIGIBLE
    const fullyVerifiedEval = evaluateSchemeEligibility(
      {
        state: "Tamil Nadu",
        gender: "female",
      },
      ruleRootGroup,
      {
        ruleVersion: 1,
        verifiedAdditionalConditionIds: ["verify-govt-school-6-12"],
      }
    );
    expect(fullyVerifiedEval.outcome).toBe("ELIGIBLE");
    expect(fullyVerifiedEval.isDefinitivelyEligible).toBe(true);
    expect(fullyVerifiedEval.unverifiedAdditionalConditions).toHaveLength(0);
  });

  it("renders Potential Match (never Eligible), bilingual additional verification conditions, and is_verified scope disclaimer on SchemeDetailClient", () => {
    const additionalExtracted = extractAdditionalConditionsFromRootGroup(
      MOCK_SCHEME_DETAIL.eligibility_rule!.root_group
    );
    expect(additionalExtracted).toHaveLength(1);

    render(
      <LanguageProvider>
        <Navbar />
        <SchemeDetailClient
          scheme={MOCK_SCHEME_DETAIL}
          profile={{
            state: "Tamil Nadu",
            gender: "female",
          }}
        />
      </LanguageProvider>
    );

    // Verify evaluation banner shows "Potential Match" and not "Eligible"
    const evalBanner = screen.getByTestId("scheme-profile-evaluation-banner");
    expect(evalBanner).toHaveAttribute("data-outcome", "POTENTIAL_MATCH");
    expect(
      screen.getByTestId("scheme-evaluation-outcome-title")
    ).toHaveTextContent("Potential Match");
    expect(
      screen.getByTestId("scheme-evaluation-outcome-description")
    ).toHaveTextContent(
      "Basic profile conditions match, but additional scheme-specific conditions require verification."
    );

    // Verify `is_verified` scope disclaimer is displayed so citizens do not mistake source check for eligibility check
    expect(
      screen.getByTestId("verified-source-scope-note")
    ).toHaveTextContent(
      /does not guarantee that every applicant-specific eligibility condition has been checked/i
    );

    // Verify additional verification conditions are displayed in English
    expect(
      screen.getByTestId("additional-verification-conditions-section")
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId("additional-verification-conditions-section")
      ).getByText(
        /Studied continuously from Class 6 to Class 12 in a Tamil Nadu Government school/i
      )
    ).toBeInTheDocument();
    // The same unverified condition is also listed in the citizen's evaluation breakdown
    expect(
      within(screen.getByTestId("evaluation-unverified-conditions")).getByText(
        /Studied continuously from Class 6 to Class 12 in a Tamil Nadu Government school/i
      )
    ).toBeInTheDocument();

    // Switch to Tamil and verify Tamil evaluation outcome, Tamil additional verification conditions, and Tamil scope note
    const langBtn = screen.getByRole("button", {
      name: /Switch language between English and Tamil/i,
    });
    fireEvent.click(langBtn);

    expect(
      screen.getByTestId("scheme-evaluation-outcome-title")
    ).toHaveTextContent("சாத்தியமான பொருத்தம் (சரிபார்ப்பு தேவை)");
    expect(
      within(
        screen.getByTestId("additional-verification-conditions-section")
      ).getByText(
        /தமிழ்நாடு அரசுப் பள்ளியில் 6 முதல் 12-ஆம் வகுப்பு வரை தொடர்ந்து பயின்றிருக்க வேண்டும்/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("verified-source-scope-note")
    ).toHaveTextContent(
      /விண்ணப்பதாரருக்கான அனைத்துத் தனிப்பட்ட தகுதி நிபந்தனைகளும் சரிபார்க்கப்பட்டுவிட்டன என்பதற்கான உத்தரவாதம் அல்ல/i
    );
  });
});


