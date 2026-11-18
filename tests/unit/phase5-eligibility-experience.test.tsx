import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { Navbar } from "@/components/layout/Navbar";
import { SchemeDetailClient } from "@/components/schemes/SchemeDetailClient";
import { OpportunitiesClient } from "@/components/schemes/OpportunitiesClient";
import { DashboardOverviewClient } from "@/components/dashboard/DashboardOverviewClient";
import { RouteErrorState } from "@/components/ui/route-error-state";
import {
  evaluateCatalogueForProfile,
  evaluateSchemeEligibility,
  type ActiveSchemeRule,
} from "@/core/eligibility";
import { calculateProfileCompletion } from "@/services/profile/schema";
import type { ProfileRow } from "@/services/profile/schema";
import type { SchemeDetailItem, SchemeListItem } from "@/services/scheme/schema";
import type { Json } from "@/types/database";

vi.mock("next/navigation", () => ({
  usePathname: () => "/opportunities",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function cond(
  id: string,
  field: string,
  operator: string,
  value: Json
): Json {
  return {
    type: "CONDITION",
    id,
    field,
    operator,
    value,
    label_en: `${field} ${operator}`,
    label_ta: `${field} ${operator} (ta)`,
  };
}

function group(
  logicalOperator: "AND" | "OR",
  children: Json[],
  additionalConditions?: Json[]
): Json {
  return {
    type: "GROUP",
    id: "root",
    logicalOperator,
    children,
    ...(additionalConditions ? { additionalConditions } : {}),
  };
}

const ADDITIONAL: Json[] = [
  {
    id: "verify-extra",
    label_en: "Holds a valid ration card as woman head of household",
    label_ta: "குடும்ப அட்டையில் பெண் குடும்பத் தலைவராக இருக்க வேண்டும்",
  },
];

function makeScheme(
  id: string,
  slug: string,
  overrides: Partial<SchemeListItem> = {}
): SchemeListItem {
  return {
    id,
    slug,
    category_id: "cat-1",
    category: {
      id: "cat-1",
      slug: "education",
      name_en: "Education",
      name_ta: "கல்வி",
      icon: null,
    },
    name_en: `Scheme ${slug}`,
    name_ta: `திட்டம் ${slug}`,
    short_description_en: "Short",
    short_description_ta: "சுருக்கம்",
    benefits_en: "Benefit",
    benefits_ta: "நன்மை",
    department_en: "Dept",
    department_ta: "துறை",
    government_level: "state",
    state_code: "TN",
    target_audiences: [],
    official_source_url: "https://www.tn.gov.in/",
    official_application_url: null,
    last_verified_at: "2026-11-15T17:25:00Z",
    is_verified: true,
    status: "active",
    mandatory_documents_count: 1,
    ...overrides,
  };
}

const FEMALE_TN_ADULT = {
  state: "Tamil Nadu",
  gender: "female",
  date_of_birth: "1990-01-01",
  annual_household_income: 100000,
};

function profileRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: "user-1",
    full_name: "Test Citizen",
    date_of_birth: "1995-06-15",
    gender: "female",
    state: "Tamil Nadu",
    district: "Chennai",
    occupation: null,
    education_level: "undergraduate",
    employment_status: "student",
    is_student: true,
    annual_household_income: 90000,
    household_size: 4,
    social_category: null,
    is_farmer: null,
    land_holding_acres: null,
    is_business_owner: null,
    has_disability: null,
    preferred_language: "en",
    created_at: "2026-11-15T00:00:00Z",
    updated_at: "2026-11-15T00:00:00Z",
    ...overrides,
  };
}

function renderWithLanguage(ui: React.ReactElement) {
  return render(
    <LanguageProvider>
      <Navbar />
      {ui}
    </LanguageProvider>
  );
}

function switchToTamil() {
  fireEvent.click(
    screen.getByRole("button", {
      name: /Switch language between English and Tamil/i,
    })
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

// ---------------------------------------------------------------------------
// 1. Deterministic evaluator — every operator and every outcome
// ---------------------------------------------------------------------------

describe("Phase 5 — evaluator operators", () => {
  const opCases: {
    name: string;
    node: Json;
    pass: Record<string, unknown>;
    fail: Record<string, unknown>;
  }[] = [
    {
      name: "EQUALS",
      node: cond("c", "state", "EQUALS", "Tamil Nadu"),
      pass: { state: "tamil nadu" },
      fail: { state: "Kerala" },
    },
    {
      name: "NOT_EQUALS",
      node: cond("c", "state", "NOT_EQUALS", "Kerala"),
      pass: { state: "Tamil Nadu" },
      fail: { state: "Kerala" },
    },
    {
      name: "GREATER_THAN",
      node: cond("c", "annual_household_income", "GREATER_THAN", 100),
      pass: { annual_household_income: 101 },
      fail: { annual_household_income: 100 },
    },
    {
      name: "GREATER_THAN_OR_EQUAL",
      node: cond("c", "annual_household_income", "GREATER_THAN_OR_EQUAL", 100),
      pass: { annual_household_income: 100 },
      fail: { annual_household_income: 99 },
    },
    {
      name: "LESS_THAN",
      node: cond("c", "annual_household_income", "LESS_THAN", 100),
      pass: { annual_household_income: 99 },
      fail: { annual_household_income: 100 },
    },
    {
      name: "LESS_THAN_OR_EQUAL",
      node: cond("c", "annual_household_income", "LESS_THAN_OR_EQUAL", 100),
      pass: { annual_household_income: 100 },
      fail: { annual_household_income: 101 },
    },
    {
      name: "IN",
      node: cond("c", "education_level", "IN", ["12th_pass", "diploma"]),
      pass: { education_level: "diploma" },
      fail: { education_level: "doctorate" },
    },
    {
      name: "NOT_IN",
      node: cond("c", "education_level", "NOT_IN", ["doctorate"]),
      pass: { education_level: "diploma" },
      fail: { education_level: "doctorate" },
    },
    {
      name: "CONTAINS",
      node: cond("c", "occupation", "CONTAINS", "weaver"),
      pass: { occupation: "Handloom Weaver" },
      fail: { occupation: "Teacher" },
    },
    {
      name: "BETWEEN",
      node: cond("c", "annual_household_income", "BETWEEN", [10, 20]),
      pass: { annual_household_income: 20 },
      fail: { annual_household_income: 21 },
    },
  ];

  for (const tc of opCases) {
    it(`${tc.name}: passes and fails deterministically (no additional conditions → ELIGIBLE / NOT_ELIGIBLE)`, () => {
      const root = group("AND", [tc.node]);
      const pass = evaluateSchemeEligibility(tc.pass, root);
      const fail = evaluateSchemeEligibility(tc.fail, root);
      expect(pass.outcome).toBe("ELIGIBLE");
      expect(pass.passedConditions).toHaveLength(1);
      expect(fail.outcome).toBe("NOT_ELIGIBLE");
      expect(fail.failedConditions).toHaveLength(1);
    });
  }

  it("is deterministic: same profile and rule produce identical results", () => {
    const root = group("AND", [cond("a", "state", "EQUALS", "Tamil Nadu")]);
    const at = new Date("2026-11-16T00:00:00Z");
    const first = evaluateSchemeEligibility(FEMALE_TN_ADULT, root, {
      referenceDate: at,
    });
    const second = evaluateSchemeEligibility(FEMALE_TN_ADULT, root, {
      referenceDate: at,
    });
    expect(second).toEqual(first);
  });

  it("derives age from date_of_birth relative to the reference date", () => {
    const root = group("AND", [cond("age", "age", "BETWEEN", [30, 40])]);
    const ok = evaluateSchemeEligibility({ date_of_birth: "1990-01-01" }, root, {
      referenceDate: new Date("2026-11-16T00:00:00Z"),
    });
    expect(ok.outcome).toBe("ELIGIBLE");
    const missing = evaluateSchemeEligibility({}, root);
    expect(missing.outcome).toBe("INSUFFICIENT_INFORMATION");
    expect(missing.missingFields).toEqual(["date_of_birth"]);
  });

  it("treats prefer_not_to_say gender as missing, never as a match", () => {
    const root = group("AND", [cond("g", "gender", "NOT_EQUALS", "male")]);
    const res = evaluateSchemeEligibility({ gender: "prefer_not_to_say" }, root);
    expect(res.outcome).toBe("INSUFFICIENT_INFORMATION");
  });

  it("OR groups pass when any branch passes; AND failure dominates missing data", () => {
    const orRoot = group("OR", [
      cond("a", "is_student", "EQUALS", true),
      cond("b", "employment_status", "EQUALS", "unemployed"),
    ]);
    expect(
      evaluateSchemeEligibility(
        { is_student: false, employment_status: "unemployed" },
        orRoot
      ).outcome
    ).toBe("ELIGIBLE");
    expect(
      evaluateSchemeEligibility(
        { is_student: false, employment_status: "employed" },
        orRoot
      ).outcome
    ).toBe("NOT_ELIGIBLE");

    const andRoot = group("AND", [
      cond("a", "state", "EQUALS", "Tamil Nadu"),
      cond("b", "gender", "EQUALS", "female"),
    ]);
    // state fails, gender missing → confirmed failure wins over missing info
    expect(
      evaluateSchemeEligibility({ state: "Kerala" }, andRoot).outcome
    ).toBe("NOT_ELIGIBLE");
  });
});

describe("Phase 5 — four outcomes and product-safety rule", () => {
  const root = group(
    "AND",
    [
      cond("state", "state", "EQUALS", "Tamil Nadu"),
      cond("gender", "gender", "EQUALS", "female"),
    ],
    ADDITIONAL
  );

  it("POTENTIAL_MATCH (not ELIGIBLE) when basic conditions pass but additional conditions are unverified", () => {
    const res = evaluateSchemeEligibility(FEMALE_TN_ADULT, root);
    expect(res.outcome).toBe("POTENTIAL_MATCH");
    expect(res.isDefinitivelyEligible).toBe(false);
    expect(res.engineStatus).toBe("NEEDS_VERIFICATION");
    expect(res.unverifiedAdditionalConditions).toHaveLength(1);
  });

  it("NOT_ELIGIBLE when a confirmed mandatory condition fails", () => {
    const res = evaluateSchemeEligibility({ state: "Kerala", gender: "female" }, root);
    expect(res.outcome).toBe("NOT_ELIGIBLE");
    expect(res.isDefinitivelyEligible).toBe(false);
  });

  it("INSUFFICIENT_INFORMATION when required profile data is missing", () => {
    const res = evaluateSchemeEligibility({ state: "Tamil Nadu" }, root);
    expect(res.outcome).toBe("INSUFFICIENT_INFORMATION");
    expect(res.missingFields).toEqual(["gender"]);
  });

  it("ELIGIBLE only when no additional conditions exist, or all are explicitly verified by the caller", () => {
    const noExtras = group("AND", [cond("s", "state", "EQUALS", "Tamil Nadu")]);
    expect(evaluateSchemeEligibility(FEMALE_TN_ADULT, noExtras).outcome).toBe(
      "ELIGIBLE"
    );
    expect(
      evaluateSchemeEligibility(FEMALE_TN_ADULT, root, {
        verifiedAdditionalConditionIds: ["verify-extra"],
      }).outcome
    ).toBe("ELIGIBLE");
  });

  it("a null or empty profile never yields POTENTIAL_MATCH or ELIGIBLE", () => {
    for (const p of [null, undefined, {}]) {
      const res = evaluateSchemeEligibility(p, root);
      expect(res.outcome).toBe("INSUFFICIENT_INFORMATION");
    }
  });

  it("rejects a requiresManualVerification flag from yielding ELIGIBLE", () => {
    const flagged = {
      ...(group("AND", [cond("s", "state", "EQUALS", "Tamil Nadu")]) as object),
      requiresManualVerification: true,
    } as Json;
    expect(evaluateSchemeEligibility(FEMALE_TN_ADULT, flagged).outcome).toBe(
      "POTENTIAL_MATCH"
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Shared catalogue evaluation service
// ---------------------------------------------------------------------------

describe("Phase 5 — evaluateCatalogueForProfile (shared service)", () => {
  const withExtras = group(
    "AND",
    [cond("state", "state", "EQUALS", "Tamil Nadu")],
    ADDITIONAL
  );
  const noExtras = group("AND", [cond("state", "state", "EQUALS", "Tamil Nadu")]);
  const keralaOnly = group("AND", [cond("state", "state", "EQUALS", "Kerala")]);
  const needsGender = group("AND", [cond("g", "gender", "EQUALS", "female")]);

  const schemes = [
    makeScheme("s-potential", "b-potential"),
    makeScheme("s-eligible", "a-eligible"),
    makeScheme("s-not", "c-not"),
    makeScheme("s-missing", "d-missing"),
    makeScheme("s-norule", "e-norule"),
    makeScheme("s-unverified", "f-unverified", {
      is_verified: false,
      last_verified_at: null,
    }),
    makeScheme("s-archived", "g-archived", { status: "archived" }),
  ];

  const rules: ActiveSchemeRule[] = [
    { scheme_id: "s-potential", rule_version: 1, root_group: withExtras },
    { scheme_id: "s-eligible", rule_version: 1, root_group: noExtras },
    { scheme_id: "s-not", rule_version: 1, root_group: keralaOnly },
    { scheme_id: "s-missing", rule_version: 1, root_group: needsGender },
    { scheme_id: "s-unverified", rule_version: 1, root_group: noExtras },
    { scheme_id: "s-archived", rule_version: 1, root_group: noExtras },
  ];

  const profile = { state: "Tamil Nadu" };

  it("evaluates each published scheme once and orders ELIGIBLE → POTENTIAL_MATCH → INSUFFICIENT → NOT_ELIGIBLE", () => {
    const summary = evaluateCatalogueForProfile(profile, schemes, rules);
    expect(summary.entries.map((e) => e.scheme.id)).toEqual([
      "s-eligible",
      "s-potential",
      "s-missing",
      "s-not",
    ]);
    expect(summary.counts).toEqual({
      ELIGIBLE: 1,
      POTENTIAL_MATCH: 1,
      INSUFFICIENT_INFORMATION: 1,
      NOT_ELIGIBLE: 1,
    });
    expect(summary.totalEvaluated).toBe(4);
  });

  it("skips unverified/archived schemes and counts schemes lacking an active rule as unevaluated", () => {
    const summary = evaluateCatalogueForProfile(profile, schemes, rules);
    const ids = summary.entries.map((e) => e.scheme.id);
    expect(ids).not.toContain("s-unverified");
    expect(ids).not.toContain("s-archived");
    expect(ids).not.toContain("s-norule");
    expect(summary.unevaluatedSchemeCount).toBe(1);
  });

  it("never reports ELIGIBLE for a scheme with unverified additional conditions", () => {
    const summary = evaluateCatalogueForProfile(profile, schemes, rules);
    const potential = summary.entries.find((e) => e.scheme.id === "s-potential");
    expect(potential?.evaluation.outcome).toBe("POTENTIAL_MATCH");
    expect(potential?.evaluation.isDefinitivelyEligible).toBe(false);
    for (const entry of summary.entries) {
      if (entry.evaluation.outcome === "ELIGIBLE") {
        expect(entry.evaluation.additionalVerificationConditions).toHaveLength(0);
      }
    }
  });

  it("uses the highest active rule version for a scheme", () => {
    const summary = evaluateCatalogueForProfile(
      profile,
      [makeScheme("s1", "one")],
      [
        { scheme_id: "s1", rule_version: 1, root_group: noExtras },
        { scheme_id: "s1", rule_version: 2, root_group: keralaOnly },
      ]
    );
    expect(summary.entries[0].evaluation.ruleVersion).toBe(2);
    expect(summary.entries[0].evaluation.outcome).toBe("NOT_ELIGIBLE");
  });

  it("an empty profile yields only INSUFFICIENT_INFORMATION across the catalogue", () => {
    const summary = evaluateCatalogueForProfile(null, schemes, rules);
    expect(summary.counts.ELIGIBLE).toBe(0);
    expect(summary.counts.POTENTIAL_MATCH).toBe(0);
    expect(summary.counts.INSUFFICIENT_INFORMATION).toBe(summary.totalEvaluated);
  });
});

// ---------------------------------------------------------------------------
// 3. Scheme detail — unauthenticated vs authenticated
// ---------------------------------------------------------------------------

const DETAIL_ROOT = group(
  "AND",
  [
    cond("cond-state", "state", "EQUALS", "Tamil Nadu"),
    cond("cond-gender", "gender", "EQUALS", "female"),
  ],
  ADDITIONAL
);

const DETAIL_SCHEME: SchemeDetailItem = {
  ...makeScheme("detail-1", "detail-scheme", {
    name_en: "Detail Test Scheme",
    name_ta: "விவரச் சோதனைத் திட்டம்",
  }),
  detailed_description_en: "Detailed",
  detailed_description_ta: "விரிவான",
  application_instructions_en: "Apply online",
  application_instructions_ta: "இணையத்தில் விண்ணப்பிக்கவும்",
  eligibility_rule: {
    id: "r1",
    rule_version: 1,
    is_active: true,
    root_group: DETAIL_ROOT,
    root_logical_operator: "AND",
    summary_en: "Summary",
    summary_ta: "சுருக்கம்",
    conditions: [
      {
        id: "cond-state",
        field: "state",
        operator: "EQUALS",
        value: "Tamil Nadu",
        label_en: "Resident of Tamil Nadu",
        label_ta: "தமிழ்நாட்டில் வசிப்பவர்",
        groupOperator: "AND",
      },
    ],
    additional_conditions: [
      {
        id: "verify-extra",
        label_en: "Holds a valid ration card as woman head of household",
        label_ta: "குடும்ப அட்டையில் பெண் குடும்பத் தலைவராக இருக்க வேண்டும்",
      },
    ],
  },
  required_documents: [],
  application_steps: [],
  sources: [],
};

describe("Phase 5 — scheme detail evaluation states", () => {
  it("unauthenticated visitor sees a sign-in prompt and NO evaluation outcome", () => {
    renderWithLanguage(<SchemeDetailClient scheme={DETAIL_SCHEME} profile={null} />);

    expect(
      screen.getByTestId("scheme-unauthenticated-evaluation-prompt")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("scheme-profile-evaluation-banner")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Insufficient Information", { selector: "[data-testid='scheme-evaluation-outcome-title']" })).not.toBeInTheDocument();

    const signIn = screen.getByRole("link", { name: /Sign in to Evaluate/i });
    expect(signIn).toHaveAttribute(
      "href",
      "/login?next=%2Fschemes%2Fdetail-scheme"
    );
    expect(
      screen
        .getAllByRole("link", { name: /Create Citizen Account/i })
        .some((link) => link.getAttribute("href") === "/register")
    ).toBe(true);
  });

  it("public (undefined profile) detail also shows the prompt, in Tamil after switching", () => {
    renderWithLanguage(<SchemeDetailClient scheme={DETAIL_SCHEME} />);
    switchToTamil();
    expect(
      screen.getByText("இந்தத் திட்டத்திற்கான உங்கள் தகுதியைச் சரிபார்க்க உள்நுழையவும்")
    ).toBeInTheDocument();
  });

  it("signed-in POTENTIAL_MATCH shows passed conditions and unverified conditions, never 'Eligible'", () => {
    renderWithLanguage(
      <SchemeDetailClient
        scheme={DETAIL_SCHEME}
        profile={{ state: "Tamil Nadu", gender: "female" }}
      />
    );
    const banner = screen.getByTestId("scheme-profile-evaluation-banner");
    expect(banner).toHaveAttribute("data-outcome", "POTENTIAL_MATCH");
    expect(
      screen.getByTestId("scheme-evaluation-outcome-title")
    ).toHaveTextContent("Potential Match");
    expect(screen.getByTestId("evaluation-passed-conditions")).toBeInTheDocument();
    const unverified = screen.getByTestId("evaluation-unverified-conditions");
    expect(
      within(unverified).getByText(/valid ration card as woman head/i)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("scheme-evaluation-outcome-title").textContent
    ).not.toMatch(/^Eligible$/);
  });

  it("signed-in NOT_ELIGIBLE lists the failed condition", () => {
    renderWithLanguage(
      <SchemeDetailClient
        scheme={DETAIL_SCHEME}
        profile={{ state: "Kerala", gender: "female" }}
      />
    );
    expect(screen.getByTestId("scheme-profile-evaluation-banner")).toHaveAttribute(
      "data-outcome",
      "NOT_ELIGIBLE"
    );
    expect(screen.getByTestId("evaluation-failed-conditions")).toBeInTheDocument();
  });

  it("signed-in INSUFFICIENT_INFORMATION lists missing fields and links to /profile", () => {
    renderWithLanguage(
      <SchemeDetailClient scheme={DETAIL_SCHEME} profile={{ state: "Tamil Nadu" }} />
    );
    const missing = screen.getByTestId("evaluation-missing-conditions");
    expect(
      within(missing).getByRole("link", { name: /Complete Missing Profile Fields/i })
    ).toHaveAttribute("href", "/profile");
  });

  it("renders the ELIGIBLE state only when the evaluation is genuinely ELIGIBLE", () => {
    const evalNoExtras = evaluateSchemeEligibility(
      FEMALE_TN_ADULT,
      group("AND", [cond("s", "state", "EQUALS", "Tamil Nadu")])
    );
    renderWithLanguage(
      <SchemeDetailClient
        scheme={{
          ...DETAIL_SCHEME,
          eligibility_rule: {
            ...DETAIL_SCHEME.eligibility_rule!,
            additional_conditions: [],
            root_group: group("AND", [cond("s", "state", "EQUALS", "Tamil Nadu")]),
          },
        }}
        evaluation={evalNoExtras}
      />
    );
    expect(screen.getByTestId("scheme-profile-evaluation-banner")).toHaveAttribute(
      "data-outcome",
      "ELIGIBLE"
    );
  });

  it("switches evaluation reasons to Tamil", () => {
    renderWithLanguage(
      <SchemeDetailClient
        scheme={DETAIL_SCHEME}
        profile={{ state: "Tamil Nadu", gender: "female" }}
      />
    );
    switchToTamil();
    expect(
      screen.getByTestId("scheme-evaluation-outcome-title")
    ).toHaveTextContent("சாத்தியமான பொருத்தம் (சரிபார்ப்பு தேவை)");
    expect(
      within(screen.getByTestId("evaluation-unverified-conditions")).getByText(
        "குடும்ப அட்டையில் பெண் குடும்பத் தலைவராக இருக்க வேண்டும்"
      )
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. Opportunities page
// ---------------------------------------------------------------------------

describe("Phase 5 — OpportunitiesClient", () => {
  const summary = evaluateCatalogueForProfile(
    { state: "Tamil Nadu" },
    [
      makeScheme("o1", "potential-one"),
      makeScheme("o2", "not-one"),
      makeScheme("o3", "missing-one"),
    ],
    [
      {
        scheme_id: "o1",
        rule_version: 1,
        root_group: group(
          "AND",
          [cond("s", "state", "EQUALS", "Tamil Nadu")],
          ADDITIONAL
        ),
      },
      {
        scheme_id: "o2",
        rule_version: 1,
        root_group: group("AND", [cond("s", "state", "EQUALS", "Kerala")]),
      },
      {
        scheme_id: "o3",
        rule_version: 1,
        root_group: group("AND", [cond("g", "gender", "EQUALS", "female")]),
      },
    ]
  );

  function renderOpportunities(isOnboardingComplete = true) {
    return renderWithLanguage(
      <OpportunitiesClient
        entries={summary.entries}
        counts={summary.counts}
        isOnboardingComplete={isOnboardingComplete}
      />
    );
  }

  it("shows every evaluated scheme with its outcome badge and the safety notice", () => {
    renderOpportunities();
    expect(screen.getByTestId("opportunities-safety-notice")).toHaveTextContent(
      /never marks a scheme as 'Eligible'/i
    );
    expect(screen.getByTestId("opportunity-card-potential-one")).toHaveAttribute(
      "data-outcome",
      "POTENTIAL_MATCH"
    );
    expect(screen.getByTestId("opportunity-card-not-one")).toHaveAttribute(
      "data-outcome",
      "NOT_ELIGIBLE"
    );
    expect(screen.getByTestId("opportunity-card-missing-one")).toHaveAttribute(
      "data-outcome",
      "INSUFFICIENT_INFORMATION"
    );
    // Potential Match card shows its unverified conditions
    expect(
      within(screen.getByTestId("opportunity-card-potential-one")).getByText(
        /valid ration card as woman head/i
      )
    ).toBeInTheDocument();
  });

  it("filters by outcome tab and shows an empty tab state with a reset", () => {
    renderOpportunities();
    fireEvent.click(screen.getByRole("button", { name: /^Eligible\s*0$/ }));
    expect(screen.getByTestId("opportunities-empty-tab")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show All Evaluated Schemes" }));
    expect(screen.getByTestId("opportunities-grid")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Potential Match\s*1$/ }));
    expect(screen.getByTestId("opportunity-card-potential-one")).toBeInTheDocument();
    expect(screen.queryByTestId("opportunity-card-not-one")).not.toBeInTheDocument();
  });

  it("shows the profile onboarding banner when information is missing", () => {
    renderOpportunities(false);
    expect(screen.getByTestId("opportunities-onboarding-banner")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Complete My Profile/i })
    ).toHaveAttribute("href", "/profile");
  });

  it("renders in Tamil", () => {
    renderOpportunities();
    switchToTamil();
    expect(screen.getByText("எனது நலத்திட்ட வாய்ப்புகள்")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("opportunity-card-potential-one")).getByTestId(
        "opportunity-outcome-badge"
      )
    ).toHaveTextContent("சாத்தியமான பொருத்தம் (சரிபார்ப்பு தேவை)");
  });
});

// ---------------------------------------------------------------------------
// 5. Dashboard
// ---------------------------------------------------------------------------

describe("Phase 5 — DashboardOverviewClient", () => {
  const profile = profileRow();
  const completion = calculateProfileCompletion(profile);

  const summary = evaluateCatalogueForProfile(
    { state: "Tamil Nadu" },
    [makeScheme("d1", "dash-potential"), makeScheme("d2", "dash-missing")],
    [
      {
        scheme_id: "d1",
        rule_version: 1,
        root_group: group(
          "AND",
          [cond("s", "state", "EQUALS", "Tamil Nadu")],
          ADDITIONAL
        ),
      },
      {
        scheme_id: "d2",
        rule_version: 1,
        root_group: group("AND", [cond("g", "gender", "EQUALS", "female")]),
      },
    ]
  );

  it("shows real outcome counts and top matches (no hardcoded placeholders)", () => {
    renderWithLanguage(
      <DashboardOverviewClient
        profile={profile}
        completion={completion}
        evaluation={{
          counts: summary.counts,
          totalEvaluated: summary.totalEvaluated,
          topEntries: summary.entries.filter(
            (e) => e.evaluation.outcome === "POTENTIAL_MATCH"
          ),
        }}
      />
    );
    expect(
      within(screen.getByTestId("dashboard-stat-POTENTIAL_MATCH")).getByText("1")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("dashboard-stat-ELIGIBLE")).getByText("0")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("dashboard-stat-INSUFFICIENT_INFORMATION")).getByText("1")
    ).toBeInTheDocument();
    expect(screen.getByTestId("opportunity-card-dash-potential")).toHaveAttribute(
      "data-outcome",
      "POTENTIAL_MATCH"
    );
    expect(
      screen.queryByText(/is being connected/i)
    ).not.toBeInTheDocument();
  });

  it("shows the complete-your-profile empty state when there are no matches, in Tamil too", () => {
    renderWithLanguage(
      <DashboardOverviewClient
        profile={profile}
        completion={completion}
        evaluation={{
          counts: {
            ELIGIBLE: 0,
            POTENTIAL_MATCH: 0,
            INSUFFICIENT_INFORMATION: 2,
            NOT_ELIGIBLE: 0,
          },
          totalEvaluated: 2,
          topEntries: [],
        }}
      />
    );
    expect(screen.getByTestId("dashboard-no-matches")).toBeInTheDocument();
    switchToTamil();
    expect(
      screen.getByText("தனிப்பயனாக்கப்பட்ட பொருத்தங்களைப் பெற சுயவிவரத்தைப் பூர்த்தி செய்யவும்")
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6. Bilingual error state
// ---------------------------------------------------------------------------

describe("Phase 5 — bilingual error state", () => {
  it("renders an accessible alert and calls retry; text is localised", () => {
    const retry = vi.fn();
    renderWithLanguage(
      <RouteErrorState
        title="Unable to load"
        description="Please try again."
        retryLabel="Try Again"
        onRetry={retry}
        backHref="/discover"
        backLabel="Back"
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/discover"
    );
  });
});
