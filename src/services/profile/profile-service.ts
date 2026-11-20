import "server-only";
import type { AppSupabaseClient } from "@/types/database";
import {
  createServerSupabaseClient,
  requireAuthenticatedServerUser,
} from "@/infrastructure/supabase/server";
import { ProfileRepository } from "@/infrastructure/repositories/profile-repository";
import {
  calculateProfileCompletion,
  CitizenProfileUpdateSchema,
  type ProfileCompletionSummary,
  type ProfileRow,
} from "./schema";

export interface AuthenticatedCitizenProfileResult {
  userId: string;
  email: string | undefined;
  profile: ProfileRow;
  completion: ProfileCompletionSummary;
}

/**
 * Retrieves the authenticated citizen's profile using their verified server session.
 * Automatically initializes an empty profile row if one does not exist yet.
 */
export async function getAuthenticatedCitizenProfile(
  client?: AppSupabaseClient
): Promise<AuthenticatedCitizenProfileResult> {
  const supabase = client ?? (await createServerSupabaseClient());
  const user = await requireAuthenticatedServerUser(supabase);
  const repo = new ProfileRepository(supabase);

  let profile = await repo.getByUserId(user.id);
  if (!profile) {
    profile = await repo.upsertByUserId(user.id, {});
  }

  return {
    userId: user.id,
    email: user.email,
    profile,
    completion: calculateProfileCompletion(profile),
  };
}

/**
 * Validates and updates the authenticated citizen's profile on the server.
 * Ignores/rejects any client-supplied user IDs; strictly uses `auth.getUser().id`.
 */
export async function updateAuthenticatedCitizenProfile(
  rawInput: unknown,
  client?: AppSupabaseClient
): Promise<AuthenticatedCitizenProfileResult> {
  const supabase = client ?? (await createServerSupabaseClient());
  const user = await requireAuthenticatedServerUser(supabase);

  const parsed = CitizenProfileUpdateSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(
      firstIssue
        ? `${firstIssue.path.join(".") || "Profile"}: ${firstIssue.message}`
        : "Invalid profile data."
    );
  }

  const repo = new ProfileRepository(supabase);
  const updatedProfile = await repo.updateByUserId(user.id, parsed.data);

  return {
    userId: user.id,
    email: user.email,
    profile: updatedProfile,
    completion: calculateProfileCompletion(updatedProfile),
  };
}
