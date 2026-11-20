import "server-only";
import type { AppSupabaseClient } from "@/types/database";
import {
  createServerSupabaseClient,
  requireAuthenticatedServerUser,
} from "@/infrastructure/supabase/server";
import { SchemeRepository } from "@/infrastructure/repositories/scheme-repository";
import {
  evaluateCatalogueForProfile,
  type CatalogueEvaluationSummary,
} from "@/core/eligibility";
import { loadAuthenticatedCitizenProfile } from "@/services/profile/profile-service";
import type {
  ProfileCompletionSummary,
  ProfileRow,
} from "@/services/profile/schema";
import {
  SchemeFilterParamsSchema,
  SchemeSlugSchema,
  type SchemeCatalogueResult,
  type SchemeDetailItem,
  type SchemeFilterParams,
} from "./schema";

export function parseSchemeFilterParams(
  rawInput: Record<string, string | string[] | undefined> | null | undefined
): SchemeFilterParams {
  if (!rawInput) {
    return {
      q: "",
      category: "all",
      level: "all",
      state: "all",
      audience: "all",
    };
  }

  const pickFirst = (val: string | string[] | undefined): string | undefined =>
    Array.isArray(val) ? val[0] : val;

  const qParsed = SchemeFilterParamsSchema.shape.q.safeParse(
    pickFirst(rawInput.q)
  );
  const categoryParsed = SchemeFilterParamsSchema.shape.category.safeParse(
    pickFirst(rawInput.category)
  );
  const levelParsed = SchemeFilterParamsSchema.shape.level.safeParse(
    pickFirst(rawInput.level)
  );
  const stateParsed = SchemeFilterParamsSchema.shape.state.safeParse(
    pickFirst(rawInput.state)
  );
  const audienceParsed = SchemeFilterParamsSchema.shape.audience.safeParse(
    pickFirst(rawInput.audience)
  );

  return {
    q: qParsed.success ? qParsed.data : "",
    category: categoryParsed.success ? categoryParsed.data : "all",
    level: levelParsed.success ? levelParsed.data : "all",
    state: stateParsed.success ? stateParsed.data : "all",
    audience: audienceParsed.success ? audienceParsed.data : "all",
  };
}

export async function getSchemeDiscoveryCatalogue(
  rawFilters?: Record<string, string | string[] | undefined> | Partial<SchemeFilterParams>,
  client?: AppSupabaseClient
): Promise<SchemeCatalogueResult> {
  const supabase = client ?? (await createServerSupabaseClient());
  const normalizedFilters = parseSchemeFilterParams(
    rawFilters as Record<string, string | string[] | undefined> | undefined
  );
  const repo = new SchemeRepository(supabase);
  return repo.getCatalogue(normalizedFilters);
}

export async function getSchemeDetailsBySlug(
  rawSlug: unknown,
  client?: AppSupabaseClient
): Promise<SchemeDetailItem | null> {
  const parsedSlug = SchemeSlugSchema.safeParse(rawSlug);
  if (!parsedSlug.success) {
    return null;
  }

  const supabase = client ?? (await createServerSupabaseClient());
  const repo = new SchemeRepository(supabase);
  return repo.getPublishedSchemeBySlug(parsedSlug.data);
}

export interface CitizenSchemeEvaluationResult
  extends CatalogueEvaluationSummary {
  profile: ProfileRow;
  completion: ProfileCompletionSummary;
  email: string | undefined;
}

/**
 * Shared, reusable profile-driven evaluation for the dashboard and opportunities
 * pages. Identity comes from the verified server session (`auth.getUser()`), and
 * both the profile and the catalogue are read with the citizen's own client, so
 * existing RLS applies. Throws `UnauthorizedError` when no session exists.
 */
export async function getCitizenSchemeEvaluations(
  client?: AppSupabaseClient
): Promise<CitizenSchemeEvaluationResult> {
  const supabase = client ?? (await createServerSupabaseClient());
  const user = await requireAuthenticatedServerUser(supabase);
  const repo = new SchemeRepository(supabase);

  const [citizen, catalogue, rules] = await Promise.all([
    loadAuthenticatedCitizenProfile(user, supabase),
    repo.getCatalogue({}),
    repo.listActiveRules(),
  ]);

  const summary = evaluateCatalogueForProfile(
    citizen.profile,
    catalogue.schemes,
    rules
  );

  return {
    ...summary,
    profile: citizen.profile,
    completion: citizen.completion,
    email: citizen.email,
  };
}
