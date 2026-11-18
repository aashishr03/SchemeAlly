import "server-only";
import { z } from "zod";
import type { AppSupabaseClient } from "@/types/database";
import { SavedSchemesRepository } from "@/infrastructure/repositories/saved-schemes-repository";
import {
  createServerSupabaseClient,
  requireAuthenticatedServerUser,
} from "@/infrastructure/supabase/server";
import { SchemeRepository } from "@/infrastructure/repositories/scheme-repository";
import type { SchemeListItem } from "@/services/scheme/schema";

const SchemeIdSchema = z.string().uuid();

export class InvalidSavedSchemeIdError extends Error {
  constructor() {
    super("A valid scheme ID is required.");
    this.name = "InvalidSavedSchemeIdError";
  }
}

export interface SavedSchemeItem {
  scheme: SchemeListItem;
  savedAt: string;
}

async function getAuthenticatedContext(client?: AppSupabaseClient) {
  const supabase = client ?? (await createServerSupabaseClient());
  const user = await requireAuthenticatedServerUser(supabase);
  return { supabase, user };
}

function parseSchemeId(rawSchemeId: unknown): string {
  const parsed = SchemeIdSchema.safeParse(rawSchemeId);
  if (!parsed.success) {
    throw new InvalidSavedSchemeIdError();
  }
  return parsed.data;
}

export async function listAuthenticatedSavedSchemes(
  client?: AppSupabaseClient
): Promise<SavedSchemeItem[]> {
  const { supabase, user } = await getAuthenticatedContext(client);
  const savedRecords = await new SavedSchemesRepository(
    supabase
  ).listByUserId(user.id);
  if (savedRecords.length === 0) {
    return [];
  }

  const catalogue = await new SchemeRepository(supabase).getCatalogue();
  const schemesById = new Map(
    catalogue.schemes.map((scheme) => [scheme.id, scheme])
  );

  return savedRecords.flatMap((record) => {
    const scheme = schemesById.get(record.scheme_id);
    return scheme ? [{ scheme, savedAt: record.created_at }] : [];
  });
}

export async function saveAuthenticatedScheme(
  rawSchemeId: unknown,
  client?: AppSupabaseClient
): Promise<void> {
  const { supabase, user } = await getAuthenticatedContext(client);
  const schemeId = parseSchemeId(rawSchemeId);
  await new SavedSchemesRepository(supabase).saveForUserId(user.id, schemeId);
}

export async function removeAuthenticatedSavedScheme(
  rawSchemeId: unknown,
  client?: AppSupabaseClient
): Promise<void> {
  const { supabase, user } = await getAuthenticatedContext(client);
  const schemeId = parseSchemeId(rawSchemeId);
  await new SavedSchemesRepository(supabase).removeForUserId(user.id, schemeId);
}
