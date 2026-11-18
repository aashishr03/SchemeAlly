// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import fs from "node:fs";
import path from "node:path";

describe("Phase 2 — Live PostgreSQL Migrations, RLS Policies, Storage & pgvector Verification", () => {
  let db: PGlite;

  const USER_A = "11111111-1111-4111-8111-111111111111";
  const USER_B = "22222222-2222-4222-8222-222222222222";

  const CATEGORY_ID = "33333333-3333-4333-8333-333333333333";
  const VERIFIED_SCHEME_ID = "44444444-4444-4444-8444-444444444444";
  const UNVERIFIED_SCHEME_ID = "55555555-5555-4555-8555-555555555555";
  const ARCHIVED_SCHEME_ID = "66666666-6666-4666-8666-666666666666";
  const REQ_DOC_ID = "77777777-7777-4777-8777-777777777777";
  const USER_A_DOC_ID = "88888888-8888-4888-8888-888888888888";
  const USER_B_DOC_ID = "99999999-9999-4999-8999-999999999999";
  const USER_A_APP_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const USER_B_APP_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const USER_A_CONV_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

  /**
   * Helper to run SQL statements inside a transaction as a specific Supabase role
   * (`anon` or `authenticated`) with `auth.uid()` set to the given user ID.
   */
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

    // 1. Bootstrap minimal Supabase auth & storage schemas and roles (anon, authenticated, service_role)
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

    // 2. Execute all three production SQL migration files in order
    const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
    const migrationFiles = [
      "20261115000001_initial_schema.sql",
      "20261115000002_rls_policies.sql",
      "20261115000003_storage_and_vector_search.sql",
    ];

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await db.exec(sql);
    }

    // 3. Insert two test users into auth.users (triggers handle_new_auth_user)
    await db.exec(`
      INSERT INTO auth.users (id, email) VALUES
        ('${USER_A}', 'usera@example.com'),
        ('${USER_B}', 'userb@example.com');
    `);

    // 4. Insert test catalogue items as database owner (published verified, unverified, and archived)
    await db.exec(`
      INSERT INTO public.scheme_categories (id, slug, name_en, name_ta, display_order)
      VALUES ('${CATEGORY_ID}', 'education', 'Education', 'கல்வி', 1);

      INSERT INTO public.schemes (
        id, slug, category_id, name_en, name_ta,
        short_description_en, short_description_ta,
        detailed_description_en, detailed_description_ta,
        benefits_en, benefits_ta,
        department_en, department_ta,
        government_level, state_code,
        application_instructions_en, application_instructions_ta,
        official_source_url, official_application_url,
        last_verified_at, is_verified, status
      ) VALUES
      (
        '${VERIFIED_SCHEME_ID}', 'pudhumai-penn-test', '${CATEGORY_ID}',
        'Pudhumai Penn Higher Education Assurance', 'புதுமைப் பெண் உயர்கல்வி உறுதித் திட்டம்',
        'Monthly financial assistance for girl students', 'மாணவிகளுக்கு மாதந்தோறும் நிதி உதவி',
        'Detailed verified description', 'விரிவான சரிபார்க்கப்பட்ட விளக்கம்',
        'Rs. 1,000 per month', 'மாதம் ரூ. 1,000',
        'Social Welfare Department', 'சமூக நலத்துறை',
        'state', 'TN',
        'Apply via official portal', 'அதிகாரப்பூர்வ தளத்தில் விண்ணப்பிக்கவும்',
        'https://www.tn.gov.in/scheme/data_view', 'https://www.pudhumaipenn.tn.gov.in',
        '2026-11-01T00:00:00Z', true, 'active'
      ),
      (
        '${UNVERIFIED_SCHEME_ID}', 'unverified-draft-scheme', '${CATEGORY_ID}',
        'Unverified Draft Scheme', 'சரிபார்க்கப்படாத திட்டம்',
        'Short', 'சுருக்கம்',
        'Detailed', 'விரிவான',
        'Benefits', 'நன்மைகள்',
        'Dept', 'துறை',
        'state', 'TN',
        'Instructions', 'வழிமுறைகள்',
        'https://www.tn.gov.in/draft', NULL,
        NULL, false, 'active'
      ),
      (
        '${ARCHIVED_SCHEME_ID}', 'archived-old-scheme', '${CATEGORY_ID}',
        'Archived Scheme', 'கைவிடப்பட்ட திட்டம்',
        'Short', 'சுருக்கம்',
        'Detailed', 'விரிவான',
        'Benefits', 'நன்மைகள்',
        'Dept', 'துறை',
        'central', 'ALL',
        'Instructions', 'வழிமுறைகள்',
        'https://www.india.gov.in/archived', NULL,
        '2025-01-01T00:00:00Z', true, 'archived'
      );

      INSERT INTO public.scheme_eligibility_rules (scheme_id, rule_version, is_active, root_group)
      VALUES
      (
        '${VERIFIED_SCHEME_ID}', 1, true,
        '{"type":"GROUP","id":"root","logicalOperator":"AND","children":[]}'::jsonb
      ),
      (
        '${UNVERIFIED_SCHEME_ID}', 1, true,
        '{"type":"GROUP","id":"root","logicalOperator":"AND","children":[]}'::jsonb
      );

      INSERT INTO public.scheme_required_documents (
        id, scheme_id, document_type_code, name_en, name_ta, is_mandatory
      ) VALUES (
        '${REQ_DOC_ID}', '${VERIFIED_SCHEME_ID}', 'INCOME_CERTIFICATE',
        'Income Certificate', 'வருமானச் சான்றிதழ்', true
      );
    `);
  });

  afterAll(async () => {
    await db.close();
  });

  it("auto-provisions citizen profiles and user_roles on auth.users signup and blocks role self-escalation", async () => {
    const profileRes = await execAsRole<{ id: string; preferred_language: string }>(
      "authenticated",
      USER_A,
      "SELECT id, preferred_language FROM public.profiles;"
    );
    expect(profileRes.rows).toHaveLength(1);
    expect(profileRes.rows[0].id).toBe(USER_A);

    const roleRes = await execAsRole<{ user_id: string; role: string }>(
      "authenticated",
      USER_A,
      "SELECT user_id, role FROM public.user_roles;"
    );
    expect(roleRes.rows).toEqual([{ user_id: USER_A, role: "citizen" }]);

    // Citizen cannot escalate their own role to admin
    await expect(
      execAsRole(
        "authenticated",
        USER_A,
        `UPDATE public.user_roles SET role = 'admin' WHERE user_id = '${USER_A}';`
      )
    ).rejects.toThrow();
  });

  it("enforces direct user ownership on profiles, documents, saved_schemes, applications, and chat_conversations", async () => {
    // USER_A updates their own profile
    await execAsRole(
      "authenticated",
      USER_A,
      `UPDATE public.profiles SET full_name = 'Anitha K', state = 'Tamil Nadu' WHERE id = '${USER_A}';`
    );

    // USER_B cannot see USER_A's profile
    const userBProfiles = await execAsRole<{ id: string; full_name: string | null }>(
      "authenticated",
      USER_B,
      "SELECT id, full_name FROM public.profiles;"
    );
    expect(userBProfiles.rows).toHaveLength(1);
    expect(userBProfiles.rows[0].id).toBe(USER_B);
    expect(userBProfiles.rows[0].full_name).toBeNull();

    // USER_A creates a document, saved scheme, application, and conversation
    await execAsRole(
      "authenticated",
      USER_A,
      `
        INSERT INTO public.documents (id, user_id, document_type_code, file_name, storage_path, mime_type, file_size_bytes)
        VALUES ('${USER_A_DOC_ID}', '${USER_A}', 'INCOME_CERTIFICATE', 'income.pdf', '${USER_A}/${USER_A_DOC_ID}/income.pdf', 'application/pdf', 120000);

        INSERT INTO public.saved_schemes (user_id, scheme_id)
        VALUES ('${USER_A}', '${VERIFIED_SCHEME_ID}');

        INSERT INTO public.applications (id, user_id, scheme_id, status)
        VALUES ('${USER_A_APP_ID}', '${USER_A}', '${VERIFIED_SCHEME_ID}', 'PREPARING_DOCUMENTS');

        INSERT INTO public.chat_conversations (id, user_id, scheme_id, title)
        VALUES ('${USER_A_CONV_ID}', '${USER_A}', '${VERIFIED_SCHEME_ID}', 'Eligibility question');
      `
    );

    // USER_B cannot insert a document pretending to be USER_A
    await expect(
      execAsRole(
        "authenticated",
        USER_B,
        `
          INSERT INTO public.documents (user_id, document_type_code, file_name, storage_path, mime_type, file_size_bytes)
          VALUES ('${USER_A}', 'INCOME_CERTIFICATE', 'spoof.pdf', '${USER_A}/spoof/spoof.pdf', 'application/pdf', 5000);
        `
      )
    ).rejects.toThrow(/row-level security/i);

    // USER_B sees 0 documents, 0 saved schemes, 0 applications, and 0 conversations of USER_A
    const bDocs = await execAsRole("authenticated", USER_B, "SELECT * FROM public.documents;");
    const bSaved = await execAsRole("authenticated", USER_B, "SELECT * FROM public.saved_schemes;");
    const bApps = await execAsRole("authenticated", USER_B, "SELECT * FROM public.applications;");
    const bConvs = await execAsRole("authenticated", USER_B, "SELECT * FROM public.chat_conversations;");

    expect(bDocs.rows).toHaveLength(0);
    expect(bSaved.rows).toHaveLength(0);
    expect(bApps.rows).toHaveLength(0);
    expect(bConvs.rows).toHaveLength(0);
  });

  it("enforces parent-child ownership on document_extractions, application_checklist_items, and chat_messages", async () => {
    // USER_A can create child records under USER_A's own document, application, and conversation
    await execAsRole(
      "authenticated",
      USER_A,
      `
        INSERT INTO public.document_extractions (document_id, applicant_name, legibility)
        VALUES ('${USER_A_DOC_ID}', 'Anitha K', 'CLEAR');

        INSERT INTO public.application_checklist_items (application_id, required_document_id, linked_document_id, is_completed)
        VALUES ('${USER_A_APP_ID}', '${REQ_DOC_ID}', '${USER_A_DOC_ID}', true);

        INSERT INTO public.chat_messages (conversation_id, role, content)
        VALUES ('${USER_A_CONV_ID}', 'user', 'Am I eligible for Pudhumai Penn?');
      `
    );

    // USER_B cannot read any of USER_A's child records
    const bExtractions = await execAsRole(
      "authenticated",
      USER_B,
      "SELECT * FROM public.document_extractions;"
    );
    const bChecklist = await execAsRole(
      "authenticated",
      USER_B,
      "SELECT * FROM public.application_checklist_items;"
    );
    const bMessages = await execAsRole(
      "authenticated",
      USER_B,
      "SELECT * FROM public.chat_messages;"
    );
    expect(bExtractions.rows).toHaveLength(0);
    expect(bChecklist.rows).toHaveLength(0);
    expect(bMessages.rows).toHaveLength(0);

    // USER_B cannot insert a message into USER_A's conversation
    await expect(
      execAsRole(
        "authenticated",
        USER_B,
        `
          INSERT INTO public.chat_messages (conversation_id, role, content)
          VALUES ('${USER_A_CONV_ID}', 'user', 'Injected message');
        `
      )
    ).rejects.toThrow(/row-level security/i);

    // USER_B creates their own application and document, then tries to link USER_A's document_id to USER_B's checklist item
    await execAsRole(
      "authenticated",
      USER_B,
      `
        INSERT INTO public.documents (id, user_id, document_type_code, file_name, storage_path, mime_type, file_size_bytes)
        VALUES ('${USER_B_DOC_ID}', '${USER_B}', 'INCOME_CERTIFICATE', 'b_income.pdf', '${USER_B}/${USER_B_DOC_ID}/b_income.pdf', 'application/pdf', 90000);

        INSERT INTO public.applications (id, user_id, scheme_id, status)
        VALUES ('${USER_B_APP_ID}', '${USER_B}', '${VERIFIED_SCHEME_ID}', 'NOT_STARTED');
      `
    );

    // Linking USER_A_DOC_ID into USER_B_APP_ID must fail RLS WITH CHECK!
    await expect(
      execAsRole(
        "authenticated",
        USER_B,
        `
          INSERT INTO public.application_checklist_items (application_id, required_document_id, linked_document_id)
          VALUES ('${USER_B_APP_ID}', '${REQ_DOC_ID}', '${USER_A_DOC_ID}');
        `
      )
    ).rejects.toThrow(/row-level security/i);

    // Linking USER_B_DOC_ID into USER_B_APP_ID succeeds
    await execAsRole(
      "authenticated",
      USER_B,
      `
        INSERT INTO public.application_checklist_items (application_id, required_document_id, linked_document_id)
        VALUES ('${USER_B_APP_ID}', '${REQ_DOC_ID}', '${USER_B_DOC_ID}');
      `
    );
  });

  it("allows citizens to read only active, verified schemes and blocks all citizen write operations on catalogue tables", async () => {
    const anonSchemes = await execAsRole<{ id: string; slug: string }>(
      "anon",
      null,
      "SELECT id, slug FROM public.schemes;"
    );
    expect(anonSchemes.rows).toEqual([
      { id: VERIFIED_SCHEME_ID, slug: "pudhumai-penn-test" },
    ]);

    const authRules = await execAsRole<{ scheme_id: string }>(
      "authenticated",
      USER_A,
      "SELECT scheme_id FROM public.scheme_eligibility_rules;"
    );
    expect(authRules.rows).toEqual([{ scheme_id: VERIFIED_SCHEME_ID }]);

    // Citizen cannot insert, update, or delete schemes or eligibility rules
    await expect(
      execAsRole(
        "authenticated",
        USER_A,
        `UPDATE public.schemes SET benefits_en = 'Tampered' WHERE id = '${VERIFIED_SCHEME_ID}';`
      )
    ).rejects.toThrow();

    await expect(
      execAsRole(
        "authenticated",
        USER_A,
        `DELETE FROM public.scheme_eligibility_rules WHERE scheme_id = '${VERIFIED_SCHEME_ID}';`
      )
    ).rejects.toThrow();
  });

  it("enforces private citizen-documents bucket configuration and user-folder storage RLS policies", async () => {
    const bucketRes = await db.query<{
      id: string;
      public: boolean;
      file_size_limit: number;
    }>("SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'citizen-documents';");
    expect(bucketRes.rows[0]).toEqual({
      id: "citizen-documents",
      public: false,
      file_size_limit: 10485760,
    });

    // USER_A can upload a PDF inside their own {USER_A}/... folder
    await execAsRole(
      "authenticated",
      USER_A,
      `
        INSERT INTO storage.objects (bucket_id, name, owner)
        VALUES ('citizen-documents', '${USER_A}/${USER_A_DOC_ID}/income.pdf', '${USER_A}');
      `
    );

    // USER_A cannot upload into USER_B's folder
    await expect(
      execAsRole(
        "authenticated",
        USER_A,
        `
          INSERT INTO storage.objects (bucket_id, name, owner)
          VALUES ('citizen-documents', '${USER_B}/${USER_A_DOC_ID}/income.pdf', '${USER_A}');
        `
      )
    ).rejects.toThrow(/row-level security/i);

    // USER_A cannot upload a disallowed file extension (.exe)
    await expect(
      execAsRole(
        "authenticated",
        USER_A,
        `
          INSERT INTO storage.objects (bucket_id, name, owner)
          VALUES ('citizen-documents', '${USER_A}/${USER_A_DOC_ID}/malware.exe', '${USER_A}');
        `
      )
    ).rejects.toThrow(/row-level security/i);

    // USER_B cannot read USER_A's storage object
    const bObjects = await execAsRole(
      "authenticated",
      USER_B,
      "SELECT * FROM storage.objects WHERE bucket_id = 'citizen-documents';"
    );
    expect(bObjects.rows).toHaveLength(0);
  });

  it("secures match_scheme_knowledge with fixed search_path, restricted permissions, and active+verified filtering on 768-d vectors", async () => {
    // Check fixed search_path configuration in pg_proc
    const procRes = await db.query<{ proconfig: string[] }>(
      "SELECT proconfig FROM pg_proc WHERE proname = 'match_scheme_knowledge';"
    );
    expect(procRes.rows[0].proconfig).toContain("search_path=public, extensions");

    // Seed knowledge chunks for verified and unverified schemes with 768-dimensional vectors
    const unitVector = `[1,${new Array(767).fill(0).join(",")}]`;
    const docVerifiedId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const docUnverifiedId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

    await db.exec(`
      INSERT INTO public.knowledge_documents (id, scheme_id, title, source_url, language, verified_at)
      VALUES
        ('${docVerifiedId}', '${VERIFIED_SCHEME_ID}', 'Pudhumai Penn Guidelines', 'https://www.tn.gov.in/scheme/data_view', 'en', '2026-11-01T00:00:00Z'),
        ('${docUnverifiedId}', '${UNVERIFIED_SCHEME_ID}', 'Draft Guidelines', 'https://www.tn.gov.in/draft', 'en', '2026-11-01T00:00:00Z');

      INSERT INTO public.knowledge_chunks (knowledge_document_id, scheme_id, chunk_index, content, language, source_url, embedding)
      VALUES
        ('${docVerifiedId}', '${VERIFIED_SCHEME_ID}', 0, 'Girl students who studied from Class 6 to 12 in government schools receive Rs. 1,000 per month.', 'en', 'https://www.tn.gov.in/scheme/data_view', '${unitVector}'::vector(768)),
        ('${docUnverifiedId}', '${UNVERIFIED_SCHEME_ID}', 0, 'Unverified chunk that must never be returned.', 'en', 'https://www.tn.gov.in/draft', '${unitVector}'::vector(768));
    `);

    // Anonymous role is denied execution of match_scheme_knowledge
    await expect(
      execAsRole(
        "anon",
        null,
        `SELECT * FROM public.match_scheme_knowledge('${unitVector}'::vector(768), 0.5, 5, NULL, 'en');`
      )
    ).rejects.toThrow(/permission denied for function match_scheme_knowledge/i);

    // Authenticated user executes match_scheme_knowledge and receives ONLY the active, verified scheme chunk
    const matchRes = await execAsRole<{
      scheme_id: string;
      scheme_slug: string;
      content: string;
      similarity: number;
    }>(
      "authenticated",
      USER_A,
      `SELECT scheme_id, scheme_slug, content, similarity FROM public.match_scheme_knowledge('${unitVector}'::vector(768), 0.5, 5, NULL, 'en');`
    );

    expect(matchRes.rows).toHaveLength(1);
    expect(matchRes.rows[0].scheme_id).toBe(VERIFIED_SCHEME_ID);
    expect(matchRes.rows[0].scheme_slug).toBe("pudhumai-penn-test");
    expect(matchRes.rows[0].similarity).toBeCloseTo(1, 5);
  });
});
