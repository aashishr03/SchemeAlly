// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import fs from "node:fs";
import path from "node:path";
import { evaluateSchemeEligibility } from "@/core/eligibility";
import { extractAdditionalConditionsFromRootGroup } from "@/services/scheme/schema";
import type { Json } from "@/types/database";

describe("Phase 4 — Live Database Scheme Catalogue Seed, Search, Filters & RLS", () => {
  let db: PGlite;
  const CITIZEN_USER_ID = "11111111-1111-4111-8111-111111111111";

  async function execAsRole<T = Record<string, unknown>>(
    role: "anon" | "authenticated",
    userId: string | null,
    sql: string
  ) {
    await db.exec("BEGIN;");
    try {
      await db.exec(`SET LOCAL ROLE ${role};`);
      if (userId) {
        await db.exec(
          `SELECT set_config('request.jwt.claim.sub', '${userId}', true);`
        );
      } else {
        await db.exec(`SELECT set_config('request.jwt.claim.sub', '', true);`);
      }
      const res = await db.exec(sql);
      await db.exec("COMMIT;");
      const lastResult = res[res.length - 1] ?? { rows: [] };
      return { rows: lastResult.rows as T[] };
    } catch (err) {
      await db.exec("ROLLBACK;");
      throw err;
    }
  }

  beforeAll(async () => {
    db = new PGlite({
      extensions: { vector },
    });

    await db.exec(`
      CREATE SCHEMA IF NOT EXISTS extensions;
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE SCHEMA IF NOT EXISTS storage;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
          CREATE ROLE service_role NOLOGIN BYPASSRLS;
        END IF;
      END
      $$;

      GRANT USAGE ON SCHEMA public, auth, storage, extensions TO anon, authenticated, service_role;

      CREATE TABLE auth.users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
      );

      CREATE OR REPLACE FUNCTION auth.uid()
      RETURNS UUID
      LANGUAGE sql
      STABLE
      AS $func$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
      $func$;

      CREATE TABLE storage.buckets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        public BOOLEAN NOT NULL DEFAULT false,
        file_size_limit BIGINT,
        allowed_mime_types TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
      );

      CREATE TABLE storage.objects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bucket_id TEXT NOT NULL REFERENCES storage.buckets(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        owner UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
        UNIQUE (bucket_id, name)
      );

      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      ALTER TABLE storage.objects FORCE ROW LEVEL SECURITY;
      GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

      CREATE OR REPLACE FUNCTION storage.foldername(name TEXT)
      RETURNS TEXT[]
      LANGUAGE sql
      IMMUTABLE
      AS $func$
        SELECT string_to_array(name, '/');
      $func$;

      CREATE OR REPLACE FUNCTION storage.extension(name TEXT)
      RETURNS TEXT
      LANGUAGE sql
      IMMUTABLE
      AS $func$
        SELECT reverse(split_part(reverse(name), '.', 1));
      $func$;
    `);

    const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
    const migrationFiles = [
      "20261115000001_initial_schema.sql",
      "20261115000002_rls_policies.sql",
      "20261115000003_storage_and_vector_search.sql",
      "20261115000004_scheme_catalogue_seed.sql",
    ];

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await db.exec(sql);
    }

    await db.exec(`
      INSERT INTO auth.users (id, email)
      VALUES ('${CITIZEN_USER_ID}', 'citizen@example.com');
    `);
  });

  afterAll(async () => {
    await db.close();
  });

  it("seeds all 9 bilingual categories and 18 verified schemes (8 Tamil Nadu + 10 Central) with complete rules, documents, steps, and official sources", async () => {
    const categories = await execAsRole<{ slug: string; name_en: string; name_ta: string }>(
      "anon",
      null,
      "SELECT slug, name_en, name_ta FROM public.scheme_categories ORDER BY display_order ASC;"
    );
    expect(categories.rows).toHaveLength(9);
    expect(categories.rows.map((c) => c.slug)).toEqual([
      "education",
      "financial-assistance",
      "women-child-welfare",
      "healthcare",
      "agriculture",
      "employment",
      "housing",
      "small-business",
      "social-welfare",
    ]);

    const schemes = await execAsRole<{
      slug: string;
      government_level: string;
      state_code: string;
      is_verified: boolean;
      status: string;
      official_source_url: string;
    }>(
      "anon",
      null,
      "SELECT slug, government_level, state_code, is_verified, status, official_source_url FROM public.schemes;"
    );

    expect(schemes.rows).toHaveLength(18);
    const stateSchemes = schemes.rows.filter(
      (s) => s.government_level === "state"
    );
    const centralSchemes = schemes.rows.filter(
      (s) => s.government_level === "central"
    );
    expect(stateSchemes).toHaveLength(8);
    expect(centralSchemes).toHaveLength(10);

    for (const scheme of schemes.rows) {
      expect(scheme.is_verified).toBe(true);
      expect(scheme.status).toBe("active");
      expect(scheme.official_source_url).toMatch(/^https?:\/\//);
    }

    // Every verified scheme must have at least 1 active eligibility rule, 1 required document, 1 step, and 1 official source
    const rulesCount = await execAsRole<{ count: string }>(
      "anon",
      null,
      "SELECT COUNT(DISTINCT scheme_id)::text AS count FROM public.scheme_eligibility_rules WHERE is_active = true;"
    );
    const docsCount = await execAsRole<{ count: string }>(
      "anon",
      null,
      "SELECT COUNT(DISTINCT scheme_id)::text AS count FROM public.scheme_required_documents;"
    );
    const stepsCount = await execAsRole<{ count: string }>(
      "anon",
      null,
      "SELECT COUNT(DISTINCT scheme_id)::text AS count FROM public.scheme_application_steps;"
    );
    const sourcesCount = await execAsRole<{ count: string }>(
      "anon",
      null,
      "SELECT COUNT(DISTINCT scheme_id)::text AS count FROM public.scheme_sources;"
    );

    expect(Number(rulesCount.rows[0].count)).toBe(18);
    expect(Number(docsCount.rows[0].count)).toBe(18);
    expect(Number(stepsCount.rows[0].count)).toBe(18);
    expect(Number(sourcesCount.rows[0].count)).toBe(18);
  });

  it("hides unverified and archived schemes from anon and authenticated users via RLS across all catalogue tables", async () => {
    const unverifiedId = "99999999-0000-4000-8000-000000000001";
    const archivedId = "99999999-0000-4000-8000-000000000002";

    await db.exec(`
      INSERT INTO public.schemes (
        id, slug, category_id, name_en, name_ta,
        short_description_en, short_description_ta,
        detailed_description_en, detailed_description_ta,
        benefits_en, benefits_ta,
        department_en, department_ta,
        government_level, state_code,
        application_instructions_en, application_instructions_ta,
        official_source_url, is_verified, last_verified_at, status
      ) VALUES
      (
        '${unverifiedId}', 'unverified-test-scheme', '10000000-0000-4000-8000-000000000001',
        'Unverified Scheme', 'சரிபார்க்கப்படாத திட்டம்',
        'Short', 'சுருக்கம்', 'Detailed', 'விரிவான', 'Benefits', 'நன்மைகள்',
        'Dept', 'துறை', 'state', 'TN', 'Apply', 'விண்ணப்பி',
        'https://www.tn.gov.in/', false, NULL, 'active'
      ),
      (
        '${archivedId}', 'archived-test-scheme', '10000000-0000-4000-8000-000000000001',
        'Archived Scheme', 'கைவிடப்பட்ட திட்டம்',
        'Short', 'சுருக்கம்', 'Detailed', 'விரிவான', 'Benefits', 'நன்மைகள்',
        'Dept', 'துறை', 'central', 'ALL', 'Apply', 'விண்ணப்பி',
        'https://www.india.gov.in/', true, '2025-01-01T00:00:00Z', 'archived'
      );
    `);

    const visibleAnon = await execAsRole<{ slug: string }>(
      "anon",
      null,
      `SELECT slug FROM public.schemes WHERE id IN ('${unverifiedId}', '${archivedId}');`
    );
    const visibleAuth = await execAsRole<{ slug: string }>(
      "authenticated",
      CITIZEN_USER_ID,
      `SELECT slug FROM public.schemes WHERE id IN ('${unverifiedId}', '${archivedId}');`
    );

    expect(visibleAnon.rows).toHaveLength(0);
    expect(visibleAuth.rows).toHaveLength(0);
  });

  it("blocks anon and authenticated users from modifying any scheme catalogue table", async () => {
    await expect(
      execAsRole(
        "authenticated",
        CITIZEN_USER_ID,
        "UPDATE public.schemes SET benefits_en = 'Tampered' WHERE slug = 'pudhumai-penn-scheme';"
      )
    ).rejects.toThrow();

    await expect(
      execAsRole(
        "anon",
        null,
        "DELETE FROM public.scheme_categories WHERE slug = 'education';"
      )
    ).rejects.toThrow();

    await expect(
      execAsRole(
        "authenticated",
        CITIZEN_USER_ID,
        "DELETE FROM public.scheme_sources;"
      )
    ).rejects.toThrow();
  });

  it("ensures all 18 seeded schemes define bilingual additional verification conditions and never produce a false definitive ELIGIBLE outcome from profile matching alone", async () => {
    const rules = await execAsRole<{
      slug: string;
      rule_version: number;
      root_group: Json;
    }>(
      "anon",
      null,
      `
        SELECT s.slug, r.rule_version, r.root_group
        FROM public.scheme_eligibility_rules r
        JOIN public.schemes s ON s.id = r.scheme_id
        WHERE r.is_active = true
        ORDER BY s.slug ASC;
      `
    );

    expect(rules.rows).toHaveLength(18);

    // Profiles designed to satisfy the automated root_group conditions of different scheme archetypes
    const candidateProfiles = [
      {
        state: "Tamil Nadu",
        gender: "female",
        age: 20,
        is_student: true,
        education_level: "undergraduate",
        employment_status: "student",
        annual_household_income: 80000,
      },
      {
        state: "Tamil Nadu",
        gender: "male",
        age: 20,
        is_student: true,
        education_level: "undergraduate",
        employment_status: "student",
        annual_household_income: 80000,
      },
      {
        state: "Tamil Nadu",
        gender: "female",
        age: 28,
        is_student: false,
        education_level: "10th_pass",
        employment_status: "unemployed",
        annual_household_income: 90000,
        is_farmer: true,
        land_holding_acres: 2,
        is_business_owner: true,
      },
      {
        state: "Tamil Nadu",
        gender: "female",
        age: 72,
        annual_household_income: 60000,
      },
      {
        state: "Tamil Nadu",
        gender: "female",
        age: 6,
        annual_household_income: 100000,
      },
    ];

    for (const row of rules.rows) {
      const additional = extractAdditionalConditionsFromRootGroup(
        row.root_group
      );
      expect(
        additional.length,
        `${row.slug} must declare at least 1 additional verification condition`
      ).toBeGreaterThanOrEqual(1);

      for (const item of additional) {
        expect(item.id.length).toBeGreaterThan(0);
        expect(item.label_en.length).toBeGreaterThan(10);
        expect(item.label_ta.length).toBeGreaterThan(10);
      }

      // Evaluate across all candidate profiles without manual verification overrides:
      // At least one candidate profile must match the automated conditions (`POTENTIAL_MATCH`),
      // and ZERO candidate profiles may ever produce `ELIGIBLE` when additional conditions are unverified.
      const outcomes = candidateProfiles.map((profile) =>
        evaluateSchemeEligibility(profile, row.root_group, {
          ruleVersion: row.rule_version,
        })
      );

      for (const res of outcomes) {
        expect(
          res.outcome,
          `${row.slug} must never return ELIGIBLE from profile match alone`
        ).not.toBe("ELIGIBLE");
        expect(res.isDefinitivelyEligible).toBe(false);
      }

      expect(
        outcomes.some((r) => r.outcome === "POTENTIAL_MATCH"),
        `${row.slug} should produce POTENTIAL_MATCH for a matching profile`
      ).toBe(true);
    }
  });
});
