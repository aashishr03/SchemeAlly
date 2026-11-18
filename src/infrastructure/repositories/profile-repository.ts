import type { AppSupabaseClient, Database } from "@/types/database";
import type {
  CitizenProfileUpdateInput,
  ProfileRow,
} from "@/services/profile/schema";

export class ProfileRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async getByUserId(authenticatedUserId: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch citizen profile: ${error.message}`);
    }

    return data;
  }

  async upsertByUserId(
    authenticatedUserId: string,
    updates: CitizenProfileUpdateInput
  ): Promise<ProfileRow> {
    const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: authenticatedUserId,
      ...updates,
    };

    const { data, error } = await this.supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to save citizen profile: ${error?.message ?? "Unknown error"}`
      );
    }

    return data;
  }
}
