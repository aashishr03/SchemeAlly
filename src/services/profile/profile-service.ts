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

export async function loadAuthenticatedCitizenProfile(
  user: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>,
  supabase: AppSupabaseClient
): Promise<AuthenticatedCitizenProfileResult> {
  const repo = new ProfileRepository(supabase);
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const parsedMetadata = metadataName
    ? CitizenProfileUpdateSchema.safeParse({ full_name: metadataName })
    : null;
  const metadataFullName =
    parsedMetadata?.success && parsedMetadata.data.full_name
      ? parsedMetadata.data.full_name
      : null;

  let profile = await repo.getByUserId(user.id);
  if (!profile) {
    profile = await repo.upsertByUserId(
      user.id,
      metadataFullName ? { full_name: metadataFullName } : {}
    );
  } else if (!profile.full_name?.trim() && metadataFullName) {
    profile = await repo.updateByUserId(user.id, {
      full_name: metadataFullName,
    });
  }

  return {
    userId: user.id,
    email: user.email,
    profile,
    completion: calculateProfileCompletion(profile),
  };
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
  return loadAuthenticatedCitizenProfile(user, supabase);
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
